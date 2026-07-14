import logging
import uuid
import threading
from datetime import datetime, time, timedelta
import requests
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, update

from app.db.session import SessionLocal
from app.models.whatsapp import Message, Conversation, MessageDirection
from app.models.workflow import (
    Workflow,
    WorkflowTrigger,
    WorkflowCondition,
    WorkflowAction,
    WorkflowExecutionLog,
    ScheduledJob,
    TriggerType,
    ConditionType,
    ActionType,
    ExecutionStatus,
    JobStatus
)
from app.services.whatsapp import send_text_message

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self):
        self._scheduler_thread = None
        self._stop_event = threading.Event()

    def start_scheduler(self):
        """Start the background daemon thread to run scheduled jobs."""
        if self._scheduler_thread and self._scheduler_thread.is_alive():
            return
        
        self._stop_event.clear()
        self._scheduler_thread = threading.Thread(
            target=self._run_scheduler,
            name="WorkflowSchedulerThread",
            daemon=True
        )
        self._scheduler_thread.start()
        logger.info("Background Workflow Scheduler Thread started.")

    def stop_scheduler(self):
        """Stop the background daemon thread."""
        self._stop_event.set()
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=2)
            logger.info("Background Workflow Scheduler Thread stopped.")

    def _run_scheduler(self):
        """Loop periodically to fetch and execute due scheduled jobs."""
        while not self._stop_event.is_set():
            db: Session = SessionLocal()
            try:
                now = datetime.utcnow()
                # Find pending jobs that are due
                jobs = db.query(ScheduledJob).filter(
                    ScheduledJob.status == JobStatus.PENDING,
                    ScheduledJob.execute_at <= now
                ).all()

                for job in jobs:
                    # Atomic claim checking to prevent double-execution race conditions
                    stmt = (
                        update(ScheduledJob)
                        .where(
                            ScheduledJob.id == job.id,
                            ScheduledJob.status == JobStatus.PENDING
                        )
                        .values(status=JobStatus.COMPLETED)
                    )
                    res = db.execute(stmt)
                    db.commit()

                    if res.rowcount == 0:
                        # Another worker process/thread has claimed it
                        logger.info(f"Scheduled job={job.id} already claimed. Skipping.")
                        continue

                    logger.info(f"Executing scheduled job={job.id} for conversation={job.conversation_id}")
                    # Execute the actions starting AFTER the delay action
                    try:
                        self.execute_remaining_actions(db, job)
                    except Exception as err:
                        logger.exception(f"Error executing scheduled job={job.id}: {err}")
                        job.status = JobStatus.FAILED
                        db.commit()

            except Exception as e:
                logger.error(f"Error in background scheduler loop: {e}")
            finally:
                db.close()
            
            # Wait 5 seconds before next poll
            self._stop_event.wait(5)

    def execute_remaining_actions(self, db: Session, job: ScheduledJob):
        """Execute the actions starting after the delay action in a scheduled job."""
        workflow = db.query(Workflow).filter(Workflow.id == job.workflow_id).first()
        if not workflow or not workflow.is_active:
            logger.warning(f"Workflow={job.workflow_id} is inactive or deleted. Skipping job.")
            return

        conversation = db.query(Conversation).filter(Conversation.id == job.conversation_id).first()
        if not conversation:
            logger.warning(f"Conversation={job.conversation_id} not found. Skipping job.")
            return

        # Fetch actions sorted by sequence
        if workflow.canvas and isinstance(workflow.canvas, dict) and "nodes" in workflow.canvas:
            from app.services.workflow_interpreter import WorkflowInterpreter
            _, _, actions = WorkflowInterpreter.compile_canvas_to_elements(workflow.canvas)
        else:
            actions = db.query(WorkflowAction).filter(
                WorkflowAction.workflow_id == workflow.id
            ).order_by(WorkflowAction.sequence.asc()).all()

        # Find the action that triggered this delay
        trigger_action_idx = -1
        for i, act in enumerate(actions):
            if act.id == job.action_id:
                trigger_action_idx = i
                break

        if trigger_action_idx == -1:
            logger.warning(f"Trigger action={job.action_id} not found in workflow. Running all actions.")
            remaining_actions = actions
        else:
            remaining_actions = actions[trigger_action_idx + 1:]

        # Execute actions
        step_results = job.payload.get("step_results", {})
        self._run_actions_list(db, workflow, conversation, remaining_actions, step_results, None)

    def evaluate_message_trigger(self, db: Session, message: Message, workspace_id: uuid.UUID):
        """
        Called when an incoming message is logged.
        Checks triggers, evaluates conditions, and runs actions for matching workflows.
        Runs synchronously in threadpool via asyncio.to_thread from endpoints.
        """
        # Security Guard: Workflows only trigger on inbound customer messages
        if message.direction != MessageDirection.INBOUND:
            return

        try:
            conversation = db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
            if not conversation:
                return

            # Infinite loop / bot-to-bot recursion storm prevention rate limit
            # Max 5 workflow executions per conversation in a sliding 1-minute window
            one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
            recent_execution_count = db.query(WorkflowExecutionLog).filter(
                WorkflowExecutionLog.conversation_id == conversation.id,
                WorkflowExecutionLog.created_at >= one_minute_ago,
                WorkflowExecutionLog.status == ExecutionStatus.SUCCESS
            ).count()

            if recent_execution_count >= 5:
                logger.warning(
                    f"Infinite loop prevention triggered for conversation={conversation.id}. "
                    f"Exceeded 5 executions in 1 minute. Skipping workflows."
                )
                return

            # Fetch all active workflows for this workspace
            workflows = db.query(Workflow).filter(
                Workflow.workspace_id == workspace_id,
                Workflow.is_active == True
            ).all()

            for workflow in workflows:
                # 1. Trigger compilation & matching
                if workflow.canvas and isinstance(workflow.canvas, dict) and "nodes" in workflow.canvas:
                    from app.services.workflow_interpreter import WorkflowInterpreter
                    triggers, conditions, actions = WorkflowInterpreter.compile_canvas_to_elements(workflow.canvas)
                else:
                    triggers = workflow.triggers
                    conditions = workflow.conditions
                    actions = workflow.actions

                triggered = False
                trigger_log = {}
                for trigger in triggers:
                    matched = self._evaluate_trigger(db, trigger, message, conversation)
                    trigger_log[trigger.trigger_type.value] = matched
                    if matched:
                        triggered = True

                if not triggered:
                    continue

                # 2. Condition evaluation (AND logic)
                conditions_met = True
                condition_log = {}
                for condition in conditions:
                    met = self._evaluate_condition(condition, message, conversation)
                    condition_log[condition.condition_type.value] = met
                    if not met:
                        conditions_met = False

                step_results = {
                    "triggers": trigger_log,
                    "conditions": condition_log,
                    "actions": {}
                }

                if not conditions_met:
                    # Log skipped run
                    self._write_execution_log(
                        db, workflow.id, workspace_id, conversation.id, message.id,
                        ExecutionStatus.SKIPPED, step_results
                    )
                    continue

                # Broadcast automation triggered WebSocket event
                try:
                    from app.ws.broadcaster import broadcaster
                    import asyncio
                    asyncio.create_task(
                        broadcaster.broadcast_automation_triggered(
                            workspace_id=workspace_id,
                            workflow_id=workflow.id,
                            workflow_name=workflow.name
                        )
                    )
                except Exception as ws_err:
                    logger.warning(f"Failed to broadcast automation trigger: {ws_err}")

                # 3. Action Execution Loop
                self._run_actions_list(db, workflow, conversation, actions, step_results, message.id)

        except Exception as e:
            logger.exception(f"Error executing workflows for message={message.id}: {e}")

    def _evaluate_trigger(self, db: Session, trigger: WorkflowTrigger, message: Message, conversation: Conversation) -> bool:
        t_type = trigger.trigger_type
        config = trigger.config

        if t_type == TriggerType.INCOMING_MESSAGE:
            return True

        elif t_type == TriggerType.KEYWORD_MATCH:
            keywords = config.get("keywords", [])
            msg_text = message.text.strip().lower()
            return any(kw.strip().lower() in msg_text for kw in keywords)

        elif t_type == TriggerType.FIRST_CUSTOMER_MESSAGE:
            # Check if this is the first message in the conversation
            count = db.query(Message).filter(Message.conversation_id == conversation.id).count()
            return count == 1

        elif t_type == TriggerType.BUSINESS_HOURS:
            # Check if message time is in/out of business hours config
            # config: { "start_hour": 9, "end_hour": 17, "match_out_of_hours": true }
            start_h = config.get("start_hour", 9)
            end_h = config.get("end_hour", 17)
            match_out = config.get("match_out_of_hours", False)
            
            msg_time = message.timestamp.time()
            in_hours = (msg_time >= time(start_h, 0) and msg_time <= time(end_h, 0))
            return not in_hours if match_out else in_hours

        elif t_type == TriggerType.CONVERSATION_CREATED:
            # Match if conversation was created recently
            time_diff = (message.timestamp - conversation.created_at).total_seconds()
            return abs(time_diff) < 5

        return False

    def _evaluate_condition(self, condition: WorkflowCondition, message: Message, conversation: Conversation) -> bool:
        c_type = condition.condition_type
        config = condition.config

        if c_type == ConditionType.MESSAGE_CONTAINS:
            text = config.get("text", "")
            return text.strip().lower() in message.text.strip().lower()

        elif c_type == ConditionType.EXACT_KEYWORD:
            keyword = config.get("keyword", "")
            return message.text.strip().lower() == keyword.strip().lower()

        elif c_type == ConditionType.CUSTOMER_TAG:
            tag = config.get("tag", "")
            return tag in conversation.tags

        elif c_type == ConditionType.TIME_RANGE:
            # config: { "start": "09:00", "end": "17:00" }
            try:
                start_str = config.get("start", "00:00")
                end_str = config.get("end", "23:59")
                sh, sm = map(int, start_str.split(":"))
                eh, em = map(int, end_str.split(":"))
                
                now_time = datetime.utcnow().time()
                return now_time >= time(sh, sm) and now_time <= time(eh, em)
            except Exception:
                return False

        elif c_type == ConditionType.CONVERSATION_STATUS:
            status = config.get("status", "open") # open or archived
            if status == "archived":
                return conversation.is_archived
            return not conversation.is_archived

        return False

    def _run_actions_list(self, db: Session, workflow: Workflow, conversation: Conversation, 
                          actions: list[WorkflowAction], step_results: dict, message_id: uuid.UUID | None):
        """Execute a list of actions sequentially."""
        workspace_id = workflow.workspace_id
        
        for action in actions:
            act_type = action.action_type
            config = action.config
            action_log_name = f"{act_type.value}_{action.sequence}"

            try:
                if act_type == ActionType.DELAY:
                    # Schedule job for the remaining actions
                    delay_seconds = int(config.get("duration_seconds", 10))
                    execute_at = datetime.utcnow() + timedelta(seconds=delay_seconds)

                    # Save current logs state to carry forward
                    step_results["actions"][action_log_name] = f"Scheduled delay of {delay_seconds} seconds."
                    
                    job = ScheduledJob(
                        workflow_id=workflow.id,
                        conversation_id=conversation.id,
                        action_id=action.id,
                        execute_at=execute_at,
                        status=JobStatus.PENDING,
                        payload={"step_results": step_results}
                    )
                    db.add(job)
                    db.commit()

                    # Write intermediate log
                    self._write_execution_log(
                        db, workflow.id, workspace_id, conversation.id, message_id,
                        ExecutionStatus.SUCCESS, step_results
                    )
                    logger.info(f"Workflow execution paused at action={action.id} (Delay {delay_seconds}s)")
                    return

                elif act_type == ActionType.SEND_MESSAGE:
                    body = config.get("text", "")
                    # Interpolate basic placeholders
                    body = body.replace("{{customer_name}}", conversation.customer_name or "Customer")
                    body = body.replace("{{customer_phone}}", conversation.customer_phone)

                    send_text_message(db, workspace_id, conversation.customer_phone, body)
                    step_results["actions"][action_log_name] = f"Sent message: '{body[:30]}...'"

                elif act_type == ActionType.ADD_TAG:
                    tag = config.get("tag", "")
                    if tag and tag not in conversation.tags:
                        # SQLAlchemy JSON mutation tracking requires replacing the list
                        conversation.tags = list(conversation.tags) + [tag]
                        db.add(conversation)
                        db.commit()
                    step_results["actions"][action_log_name] = f"Added tag: {tag}"

                elif act_type == ActionType.REMOVE_TAG:
                    tag = config.get("tag", "")
                    if tag and tag in conversation.tags:
                        conversation.tags = [t for t in conversation.tags if t != tag]
                        db.add(conversation)
                        db.commit()
                    step_results["actions"][action_log_name] = f"Removed tag: {tag}"

                elif act_type == ActionType.ASSIGN_CONVERSATION:
                    user_id_str = config.get("user_id")
                    if user_id_str:
                        conversation.assigned_to = uuid.UUID(user_id_str)
                        db.add(conversation)
                        db.commit()
                    step_results["actions"][action_log_name] = f"Assigned conversation to {user_id_str}"

                elif act_type == ActionType.CALL_WEBHOOK:
                    url = config.get("url")
                    payload = {
                        "event": "workflow_trigger",
                        "workflow_id": str(workflow.id),
                        "workflow_name": workflow.name,
                        "conversation_id": str(conversation.id),
                        "customer_phone": conversation.customer_phone,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    response = requests.post(url, json=payload, timeout=5)
                    step_results["actions"][action_log_name] = f"Called webhook URL: {url} -> status {response.status_code}"

                elif act_type == ActionType.AI_RESPONSE:
                    # Mock AI response simulation
                    prompt = config.get("prompt", "Analyze request")
                    ai_reply = f"[AI Smart Reply] Thank you for your inquiry about '{prompt}'. We are analyzing your request and will get back shortly!"
                    send_text_message(db, workspace_id, conversation.customer_phone, ai_reply)
                    step_results["actions"][action_log_name] = f"Simulated AI reply: '{ai_reply[:30]}...'"

            except Exception as action_err:
                logger.error(f"Action error in workflow={workflow.id} action={act_type}: {action_err}")
                step_results["actions"][action_log_name] = f"FAILED: {str(action_err)}"
                self._write_execution_log(
                    db, workflow.id, workspace_id, conversation.id, message_id,
                    ExecutionStatus.FAILED, step_results
                )
                db.rollback()
                return

        # Write final completed log
        self._write_execution_log(
            db, workflow.id, workspace_id, conversation.id, message_id,
            ExecutionStatus.SUCCESS, step_results
        )

    def _write_execution_log(self, db: Session, workflow_id: uuid.UUID, workspace_id: uuid.UUID,
                             conversation_id: uuid.UUID | None, message_id: uuid.UUID | None,
                             status: ExecutionStatus, step_results: dict):
        log = WorkflowExecutionLog(
            workflow_id=workflow_id,
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            message_id=message_id,
            status=status,
            step_results=step_results
        )
        db.add(log)
        db.commit()

        # If SUCCESS or FAILED, broadcast the execution logs update
        if status in [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED]:
            try:
                workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                wf_name = workflow.name if workflow else "Unknown Workflow"
                
                from app.ws.broadcaster import broadcaster
                import asyncio
                asyncio.create_task(
                    broadcaster.broadcast_workflow_execution(
                        workspace_id=workspace_id,
                        workflow_id=workflow_id,
                        workflow_name=wf_name,
                        status=status.value,
                        conversation_id=conversation_id
                    )
                )
            except Exception as ws_err:
                logger.warning(f"Failed to broadcast workflow execution event: {ws_err}")

# Singleton instance of the engine
automation_engine = AutomationEngine()
