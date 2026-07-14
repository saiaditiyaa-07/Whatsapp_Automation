import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, DateTime, Enum, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class TriggerType(str, enum.Enum):
    INCOMING_MESSAGE = "incoming_message"
    KEYWORD_MATCH = "keyword_match"
    FIRST_CUSTOMER_MESSAGE = "first_customer_message"
    BUSINESS_HOURS = "business_hours"
    CONVERSATION_CREATED = "conversation_created"

class ConditionType(str, enum.Enum):
    MESSAGE_CONTAINS = "message_contains"
    EXACT_KEYWORD = "exact_keyword"
    CUSTOMER_TAG = "customer_tag"
    TIME_RANGE = "time_range"
    CONVERSATION_STATUS = "conversation_status"

class ActionType(str, enum.Enum):
    SEND_MESSAGE = "send_message"
    DELAY = "delay"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"
    ASSIGN_CONVERSATION = "assign_conversation"
    CALL_WEBHOOK = "call_webhook"
    AI_RESPONSE = "ai_response"

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class ExecutionStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"

class Workflow(Base):
    __tablename__ = "automation_workflows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    canvas: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    triggers: Mapped[list["WorkflowTrigger"]] = relationship("WorkflowTrigger", back_populates="workflow", cascade="all, delete-orphan")
    conditions: Mapped[list["WorkflowCondition"]] = relationship("WorkflowCondition", back_populates="workflow", cascade="all, delete-orphan")
    actions: Mapped[list["WorkflowAction"]] = relationship("WorkflowAction", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowTrigger(Base):
    __tablename__ = "automation_triggers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    trigger_type: Mapped[TriggerType] = mapped_column(Enum(TriggerType), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="triggers")

class WorkflowCondition(Base):
    __tablename__ = "automation_conditions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    condition_type: Mapped[ConditionType] = mapped_column(Enum(ConditionType), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="conditions")

class WorkflowAction(Base):
    __tablename__ = "automation_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    action_type: Mapped[ActionType] = mapped_column(Enum(ActionType), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="actions")

class WorkflowExecutionLog(Base):
    __tablename__ = "workflow_execution_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True)
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    status: Mapped[ExecutionStatus] = mapped_column(Enum(ExecutionStatus), nullable=False)
    step_results: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class ScheduledJob(Base):
    __tablename__ = "scheduled_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    action_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_actions.id", ondelete="CASCADE"), nullable=False)
    execute_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    node_id: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(255), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    position_x: Mapped[float] = mapped_column(nullable=False)
    position_y: Mapped[float] = mapped_column(nullable=False)

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    edge_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    target: Mapped[str] = mapped_column(String(255), nullable=False)

class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("automation_workflows.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[int] = mapped_column(nullable=False)
    canvas: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
