import unittest
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.base_class import Base
from app.models.workflow import Workflow, WorkflowExecutionLog, ExecutionStatus
from app.models.whatsapp import Conversation, Message, MessageDirection
from app.services.analytics import AnalyticsService, AnalyticsRepository

class TestAnalyticsService(unittest.TestCase):
    def setUp(self):
        # We can use the test session database context
        self.db = SessionLocal()
        self.workspace_id = uuid.uuid4()
        
        # Seed test data
        self.conversation = Conversation(
            id=uuid.uuid4(),
            workspace_id=self.workspace_id,
            customer_name="Test Customer",
            customer_phone="1234567890",
            is_archived=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        self.db.add(self.conversation)
        self.db.commit()

        # Seed text message inbound
        self.msg_in = Message(
            id=uuid.uuid4(),
            conversation_id=self.conversation.id,
            direction=MessageDirection.INBOUND,
            message_type="text",
            text="hello",
            status="read",
            timestamp=datetime.utcnow() - timedelta(hours=1)
        )
        self.db.add(self.msg_in)

        # Seed text message outbound
        self.msg_out = Message(
            id=uuid.uuid4(),
            conversation_id=self.conversation.id,
            direction=MessageDirection.OUTBOUND,
            message_type="text",
            text="world reply",
            status="sent",
            timestamp=datetime.utcnow() - timedelta(minutes=30)
        )
        self.db.add(self.msg_out)

        # Seed workflow
        self.workflow = Workflow(
            id=uuid.uuid4(),
            workspace_id=self.workspace_id,
            name="Test Auto Workflow",
            is_active=True
        )
        self.db.add(self.workflow)
        self.db.commit()

        # Seed executions log
        self.log_success = WorkflowExecutionLog(
            id=uuid.uuid4(),
            workflow_id=self.workflow.id,
            workspace_id=self.workspace_id,
            conversation_id=self.conversation.id,
            status=ExecutionStatus.SUCCESS,
            step_results={},
            created_at=datetime.utcnow() - timedelta(minutes=15)
        )
        self.db.add(self.log_success)
        self.db.commit()

    def tearDown(self):
        # Clean up database records
        self.db.query(WorkflowExecutionLog).delete()
        self.db.query(Message).delete()
        self.db.query(Conversation).delete()
        self.db.query(Workflow).delete()
        self.db.commit()
        self.db.close()

    def test_overview_kpi_counts(self):
        kpis = AnalyticsService.get_overview_kpis(self.db, self.workspace_id)
        self.assertEqual(kpis["messages_today"], 2)
        self.assertEqual(kpis["active_conversations"], 1)
        self.assertEqual(kpis["total_conversations"], 1)
        self.assertEqual(kpis["total_customers"], 1)
        self.assertEqual(kpis["workflow_executions_today"], 1)
        self.assertEqual(kpis["failed_executions"], 0)
        self.assertEqual(kpis["automation_success_rate"], 100.0)

    def test_messages_analytics(self):
        metrics = AnalyticsService.get_messages_analytics(self.db, self.workspace_id, "last_7_days")
        self.assertIn("messages_per_day", metrics)
        self.assertIn("messages_per_hour", metrics)
        self.assertEqual(metrics["incoming_vs_outgoing"]["incoming"], 1)
        self.assertEqual(metrics["incoming_vs_outgoing"]["outgoing"], 1)
        self.assertEqual(metrics["media_vs_text"]["text"], 2)
        self.assertEqual(metrics["media_vs_text"]["media"], 0)

    def test_conversations_analytics(self):
        metrics = AnalyticsService.get_conversations_analytics(self.db, self.workspace_id, "last_7_days")
        self.assertEqual(metrics["new_conversations"], 1)
        self.assertEqual(metrics["open_conversations"], 1)
        self.assertEqual(metrics["closed_conversations"], 0)

    def test_workflows_analytics(self):
        metrics = AnalyticsService.get_workflows_analytics(self.db, self.workspace_id, "last_7_days")
        self.assertEqual(metrics["execution_count"], 1)
        self.assertEqual(metrics["success_count"], 1)
        self.assertEqual(metrics["failure_count"], 0)
        self.assertEqual(len(metrics["top_executed_workflows"]), 1)
        self.assertEqual(metrics["top_executed_workflows"][0]["name"], "Test Auto Workflow")

    def test_performance_analytics(self):
        metrics = AnalyticsService.get_performance_analytics(self.db, self.workspace_id, "last_7_days")
        self.assertIn("peak_messaging_hours", metrics)
        self.assertEqual(metrics["conversation_status_distribution"]["open"], 1)
        self.assertEqual(metrics["conversation_status_distribution"]["closed"], 0)

if __name__ == "__main__":
    unittest.main()
