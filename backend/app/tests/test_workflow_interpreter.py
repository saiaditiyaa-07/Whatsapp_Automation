import unittest
import uuid
from app.services.workflow_interpreter import WorkflowValidator, WorkflowInterpreter
from app.models.workflow import TriggerType, ConditionType, ActionType

class TestWorkflowInterpreter(unittest.TestCase):
    def test_validation_no_trigger(self):
        canvas = {
            "nodes": [
                {
                    "id": "action_1",
                    "type": "send_message",
                    "data": {"config": {"text": "hello"}}
                }
            ],
            "edges": []
        }
        errors = WorkflowValidator.validate_canvas(canvas)
        self.assertTrue(any("Trigger node" in err["message"] for err in errors))

    def test_validation_multiple_triggers(self):
        canvas = {
            "nodes": [
                {"id": "t1", "type": "incoming_message", "data": {}},
                {"id": "t2", "type": "keyword_match", "data": {"config": {"keywords": ["hi"]}}}
            ],
            "edges": []
        }
        errors = WorkflowValidator.validate_canvas(canvas)
        self.assertTrue(any("Multiple trigger nodes" in err["message"] for err in errors))

    def test_validation_circular_loop(self):
        canvas = {
            "nodes": [
                {"id": "t1", "type": "incoming_message", "data": {}},
                {"id": "a1", "type": "send_message", "data": {"config": {"text": "test"}}},
                {"id": "a2", "type": "delay", "data": {"config": {"duration_seconds": 10}}}
            ],
            "edges": [
                {"source": "t1", "target": "a1"},
                {"source": "a1", "target": "a2"},
                {"source": "a2", "target": "a1"}  # Loop between a1 and a2
            ]
        }
        errors = WorkflowValidator.validate_canvas(canvas)
        self.assertTrue(any("Circular connection/loop detected" in err["message"] for err in errors))

    def test_validation_unreachable_node(self):
        canvas = {
            "nodes": [
                {"id": "t1", "type": "incoming_message", "data": {}},
                {"id": "a1", "type": "send_message", "data": {"config": {"text": "test"}}},
                {"id": "a2", "type": "delay", "data": {"config": {"duration_seconds": 10}}}
            ],
            "edges": [
                {"source": "t1", "target": "a1"}
                # a2 is not connected, so unreachable
            ]
        }
        errors = WorkflowValidator.validate_canvas(canvas)
        self.assertTrue(any("unreachable" in err["message"] for err in errors))

    def test_interpretation_linear_compilation(self):
        canvas = {
            "nodes": [
                {"id": "t1", "type": "incoming_message", "data": {"config": {}}},
                {"id": "c1", "type": "message_contains", "data": {"config": {"text": "help"}}},
                {"id": "a1", "type": "send_message", "data": {"config": {"text": "How can I help you?"}}},
                {"id": "a2", "type": "add_tag", "data": {"config": {"tag": "support"}}}
            ],
            "edges": [
                {"source": "t1", "target": "c1"},
                {"source": "c1", "target": "a1"},
                {"source": "a1", "target": "a2"}
            ]
        }
        triggers, conditions, actions = WorkflowInterpreter.compile_canvas_to_elements(canvas)
        self.assertEqual(len(triggers), 1)
        self.assertEqual(triggers[0].trigger_type, TriggerType.INCOMING_MESSAGE)
        
        self.assertEqual(len(conditions), 1)
        self.assertEqual(conditions[0].condition_type, ConditionType.MESSAGE_CONTAINS)
        self.assertEqual(conditions[0].config["text"], "help")
        
        self.assertEqual(len(actions), 2)
        self.assertEqual(actions[0].action_type, ActionType.SEND_MESSAGE)
        self.assertEqual(actions[0].sequence, 0)
        self.assertEqual(actions[1].action_type, ActionType.ADD_TAG)
        self.assertEqual(actions[1].sequence, 1)

if __name__ == "__main__":
    unittest.main()
