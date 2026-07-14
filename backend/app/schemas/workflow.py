import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.models.workflow import TriggerType, ConditionType, ActionType, ExecutionStatus

class TriggerBase(BaseModel):
    trigger_type: TriggerType
    config: dict = {}

class TriggerCreate(TriggerBase):
    pass

class TriggerResponse(TriggerBase):
    id: uuid.UUID
    workflow_id: uuid.UUID

    class Config:
        from_attributes = True

class ConditionBase(BaseModel):
    condition_type: ConditionType
    config: dict = {}

class ConditionCreate(ConditionBase):
    pass

class ConditionResponse(ConditionBase):
    id: uuid.UUID
    workflow_id: uuid.UUID

    class Config:
        from_attributes = True

class ActionBase(BaseModel):
    action_type: ActionType
    config: dict = {}
    sequence: int = 0

class ActionCreate(ActionBase):
    pass

class ActionResponse(ActionBase):
    id: uuid.UUID
    workflow_id: uuid.UUID

    class Config:
        from_attributes = True

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    canvas: Optional[dict] = None

class WorkflowCreate(WorkflowBase):
    triggers: List[TriggerCreate] = []
    conditions: List[ConditionCreate] = []
    actions: List[ActionCreate] = []

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    canvas: Optional[dict] = None
    triggers: Optional[List[TriggerCreate]] = None
    conditions: Optional[List[ConditionCreate]] = None
    actions: Optional[List[ActionCreate]] = None

class WorkflowResponse(WorkflowBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    triggers: List[TriggerResponse] = []
    conditions: List[ConditionResponse] = []
    actions: List[ActionResponse] = []

    class Config:
        from_attributes = True

class WorkflowExecutionLogResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    workspace_id: uuid.UUID
    conversation_id: Optional[uuid.UUID] = None
    message_id: Optional[uuid.UUID] = None
    status: ExecutionStatus
    step_results: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True

class CanvasSave(BaseModel):
    nodes: List[dict]
    edges: List[dict]
