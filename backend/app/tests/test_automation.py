import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, time
import uuid

import app.db.base  # noqa: Ensure all models are registered in SQLAlchemy

from app.models.workflow import (
    WorkflowTrigger,
    WorkflowCondition,
    TriggerType,
    ConditionType
)
from app.models.whatsapp import Message, Conversation
from app.services.automation import automation_engine

class TestAutomationEngine(unittest.TestCase):

    def test_evaluate_trigger_incoming_message(self):
        """Verify that INCOMING_MESSAGE trigger always matches."""
        trigger = WorkflowTrigger(trigger_type=TriggerType.INCOMING_MESSAGE, config={})
        message = Message(text="Hello")
        conversation = Conversation()
        db = MagicMock()
        
        result = automation_engine._evaluate_trigger(db, trigger, message, conversation)
        self.assertTrue(result)

    def test_evaluate_trigger_keyword_match_success(self):
        """Verify that KEYWORD_MATCH trigger matches when keyword is present."""
        trigger = WorkflowTrigger(
            trigger_type=TriggerType.KEYWORD_MATCH, 
            config={"keywords": ["support", "help"]}
        )
        message = Message(text="I need support with billing")
        conversation = Conversation()
        db = MagicMock()
        
        result = automation_engine._evaluate_trigger(db, trigger, message, conversation)
        self.assertTrue(result)

    def test_evaluate_trigger_keyword_match_failure(self):
        """Verify that KEYWORD_MATCH trigger fails when no keywords are present."""
        trigger = WorkflowTrigger(
            trigger_type=TriggerType.KEYWORD_MATCH, 
            config={"keywords": ["support", "help"]}
        )
        message = Message(text="Good morning")
        conversation = Conversation()
        db = MagicMock()
        
        result = automation_engine._evaluate_trigger(db, trigger, message, conversation)
        self.assertFalse(result)

    def test_evaluate_condition_message_contains_success(self):
        """Verify MESSAGE_CONTAINS matches when string is present."""
        condition = WorkflowCondition(
            condition_type=ConditionType.MESSAGE_CONTAINS,
            config={"text": "pricing"}
        )
        message = Message(text="Could you send the pricing plans?")
        conversation = Conversation()
        
        result = automation_engine._evaluate_condition(condition, message, conversation)
        self.assertTrue(result)

    def test_evaluate_condition_exact_keyword_success(self):
        """Verify EXACT_KEYWORD matches when message is an exact match."""
        condition = WorkflowCondition(
            condition_type=ConditionType.EXACT_KEYWORD,
            config={"keyword": "hello"}
        )
        message = Message(text=" Hello ")
        conversation = Conversation()
        
        result = automation_engine._evaluate_condition(condition, message, conversation)
        self.assertTrue(result)

    def test_evaluate_condition_customer_tag_success(self):
        """Verify CUSTOMER_TAG matches when tag is present in conversation tags."""
        condition = WorkflowCondition(
            condition_type=ConditionType.CUSTOMER_TAG,
            config={"tag": "vip"}
        )
        message = Message(text="Hello")
        conversation = Conversation(tags=["new", "vip", "lead"])
        
        result = automation_engine._evaluate_condition(condition, message, conversation)
        self.assertTrue(result)

    def test_evaluate_condition_conversation_status_open(self):
        """Verify CONVERSATION_STATUS matches when conversation is open/archived correctly."""
        condition = WorkflowCondition(
            condition_type=ConditionType.CONVERSATION_STATUS,
            config={"status": "open"}
        )
        message = Message(text="Hello")
        conversation = Conversation(is_archived=False)
        
        result = automation_engine._evaluate_condition(condition, message, conversation)
        self.assertTrue(result)

        conversation.is_archived = True
        result = automation_engine._evaluate_condition(condition, message, conversation)
        self.assertFalse(result)

if __name__ == "__main__":
    unittest.main()
