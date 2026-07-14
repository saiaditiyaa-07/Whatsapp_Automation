import logging
import uuid
from typing import Dict, Any, List, Set, Tuple
from app.models.workflow import (
    Workflow,
    WorkflowTrigger,
    WorkflowCondition,
    WorkflowAction,
    TriggerType,
    ConditionType,
    ActionType
)

logger = logging.getLogger(__name__)

class WorkflowValidationError(Exception):
    def __init__(self, errors: List[Dict[str, Any]]):
        self.errors = errors
        super().__init__(str(errors))

class WorkflowValidator:
    @staticmethod
    def validate_canvas(canvas: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Validate a workflow canvas JSON layout.
        Returns a list of errors: [{"node_id": str, "message": str}]
        """
        errors = []
        nodes = canvas.get("nodes", [])
        edges = canvas.get("edges", [])

        if not nodes:
            return [{"node_id": "global", "message": "Workflow contains no nodes."}]

        # 1. Trigger Check: Exactly 1 trigger node
        trigger_nodes = []
        trigger_types = {t.value for t in TriggerType}
        condition_types = {c.value for c in ConditionType}
        action_types = {a.value for a in ActionType}

        for node in nodes:
            node_type = node.get("type")
            if node_type in trigger_types:
                trigger_nodes.append(node)

        if len(trigger_nodes) == 0:
            errors.append({"node_id": "global", "message": "Workflow must have exactly one Trigger node (none found)."})
            return errors
        elif len(trigger_nodes) > 1:
            for t in trigger_nodes:
                errors.append({"node_id": t.get("id"), "message": "Multiple trigger nodes are not allowed. Exactly one trigger required."})
            return errors

        trigger_node = trigger_nodes[0]
        trigger_id = trigger_node.get("id")

        # 2. Max Node Count Check
        if len(nodes) > 20:
            errors.append({"node_id": "global", "message": "Workflow exceeds maximum allowed node count of 20 nodes."})

        # Build adjacency maps
        adj_map: Dict[str, List[str]] = {n.get("id"): [] for n in nodes}
        reverse_adj_map: Dict[str, List[str]] = {n.get("id"): [] for n in nodes}
        
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in adj_map and tgt in adj_map:
                adj_map[src].append(tgt)
                reverse_adj_map[tgt].append(src)

        # 3. Cycle/Loop Detection (DFS check)
        visited = {}  # 0 = unvisited, 1 = visiting, 2 = visited
        has_cycle = False
        cycle_nodes = set()

        def dfs_cycle(node_id: str):
            nonlocal has_cycle
            visited[node_id] = 1
            for neighbor in adj_map.get(node_id, []):
                if visited.get(neighbor, 0) == 1:
                    has_cycle = True
                    cycle_nodes.add(node_id)
                    cycle_nodes.add(neighbor)
                elif visited.get(neighbor, 0) == 0:
                    dfs_cycle(neighbor)
            visited[node_id] = 2

        for node in nodes:
            node_id = node.get("id")
            if visited.get(node_id, 0) == 0:
                dfs_cycle(node_id)

        if has_cycle:
            for c_node in cycle_nodes:
                errors.append({"node_id": c_node, "message": "Circular connection/loop detected. Workflows must be loop-free."})

        # 4. Unreachable Nodes Check
        reachable: Set[str] = set()
        
        def dfs_reachable(node_id: str):
            reachable.add(node_id)
            for neighbor in adj_map.get(node_id, []):
                if neighbor not in reachable:
                    dfs_reachable(neighbor)

        dfs_reachable(trigger_id)

        for node in nodes:
            node_id = node.get("id")
            if node_id not in reachable:
                errors.append({"node_id": node_id, "message": "Node is unreachable from the trigger."})

        # 5. Maximum Depth / Path Length Check
        max_depth = 0
        depths: Dict[str, int] = {}

        def get_max_depth(node_id: str) -> int:
            if node_id in depths:
                return depths[node_id]
            
            neighbors = adj_map.get(node_id, [])
            if not neighbors:
                depths[node_id] = 1
                return 1
            
            # Avoid hanging if cycle exists (cycle checks already added errors)
            max_n_depth = 0
            for neighbor in neighbors:
                if neighbor != node_id and neighbor not in cycle_nodes:
                    max_n_depth = max(max_n_depth, get_max_depth(neighbor))
            
            depths[node_id] = 1 + max_n_depth
            return depths[node_id]

        if not has_cycle:
            max_depth = get_max_depth(trigger_id)
            if max_depth > 15:
                errors.append({"node_id": "global", "message": f"Workflow depth exceeds limit of 15 steps (found {max_depth})."})

        # 6. Validate Individual Node Configurations
        for node in nodes:
            node_id = node.get("id")
            node_type = node.get("type")
            config = node.get("data", {}).get("config", {})

            if node_type == "keyword_match":
                kws = config.get("keywords", [])
                if not kws or all(not str(k).strip() for k in kws):
                    errors.append({"node_id": node_id, "message": "Keyword Match trigger requires at least one valid keyword."})
            
            elif node_type == "send_message":
                text = config.get("text", "")
                if not text or not str(text).strip():
                    errors.append({"node_id": node_id, "message": "Send WhatsApp Message action requires a message body."})
            
            elif node_type == "delay":
                duration = config.get("duration_seconds")
                if duration is None or int(duration) <= 0:
                    errors.append({"node_id": node_id, "message": "Delay action requires duration duration greater than 0."})

            elif node_type == "add_tag" or node_type == "remove_tag":
                tag = config.get("tag", "")
                if not tag or not str(tag).strip():
                    errors.append({"node_id": node_id, "message": "Tag action requires a tag name."})

            elif node_type == "assign_conversation":
                user_id = config.get("user_id")
                if not user_id:
                    errors.append({"node_id": node_id, "message": "Assign conversation action requires a target User/Agent ID."})

            elif node_type == "call_webhook":
                url = config.get("url")
                if not url or not str(url).startswith("http"):
                    errors.append({"node_id": node_id, "message": "Call External Webhook action requires a valid HTTP/HTTPS URL."})

            elif node_type == "ai_response":
                prompt = config.get("prompt")
                if not prompt or not str(prompt).strip():
                    errors.append({"node_id": node_id, "message": "AI reply requires context instructions prompt."})

        return errors

class WorkflowInterpreter:
    @staticmethod
    def compile_canvas_to_elements(canvas: Dict[str, Any]) -> Tuple[List[WorkflowTrigger], List[WorkflowCondition], List[WorkflowAction]]:
        """
        Compile React Flow canvas layout JSON into list of in-memory triggers, conditions, and actions.
        Traverses nodes and connections linearly from the trigger.
        """
        nodes = canvas.get("nodes", [])
        edges = canvas.get("edges", [])

        if not nodes:
            return [], [], []

        # Maps for quick lookup
        node_map = {n.get("id"): n for n in nodes}
        adj_map: Dict[str, List[str]] = {n.get("id"): [] for n in nodes}
        
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in adj_map and tgt in adj_map:
                adj_map[src].append(tgt)

        # Find the trigger node
        trigger_node = None
        trigger_types = {t.value for t in TriggerType}
        for n in nodes:
            if n.get("type") in trigger_types:
                trigger_node = n
                break

        if not trigger_node:
            return [], [], []

        compiled_triggers: List[WorkflowTrigger] = []
        compiled_conditions: List[WorkflowCondition] = []
        compiled_actions: List[WorkflowAction] = []

        # Instatiate Trigger
        trigger_type_val = trigger_node.get("type")
        trigger_config = trigger_node.get("data", {}).get("config", {})
        
        db_trigger = WorkflowTrigger(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, str(trigger_node.get("id"))),
            trigger_type=TriggerType(trigger_type_val),
            config=trigger_config
        )
        compiled_triggers.append(db_trigger)

        # Traverse downstream from the trigger to collect conditions and actions
        visited = set()
        action_sequence = 0

        # We trace paths starting from trigger's connections
        queue = list(adj_map.get(trigger_node.get("id"), []))
        
        while queue:
            curr_id = queue.pop(0)
            if curr_id in visited:
                continue
            visited.add(curr_id)

            curr_node = node_map.get(curr_id)
            if not curr_node:
                continue

            node_type = curr_node.get("type")
            node_config = curr_node.get("data", {}).get("config", {})

            # 1. Condition compilation
            if node_type in {c.value for c in ConditionType}:
                db_cond = WorkflowCondition(
                    id=uuid.uuid5(uuid.NAMESPACE_DNS, str(curr_id)),
                    condition_type=ConditionType(node_type),
                    config=node_config
                )
                compiled_conditions.append(db_cond)

            # 2. Action compilation
            elif node_type in {a.value for a in ActionType}:
                db_act = WorkflowAction(
                    id=uuid.uuid5(uuid.NAMESPACE_DNS, str(curr_id)),
                    action_type=ActionType(node_type),
                    config=node_config,
                    sequence=action_sequence
                )
                compiled_actions.append(db_act)
                action_sequence += 1

            # Follow downstream targets
            for target_id in adj_map.get(curr_id, []):
                if target_id not in visited:
                    queue.append(target_id)

        return compiled_triggers, compiled_conditions, compiled_actions
