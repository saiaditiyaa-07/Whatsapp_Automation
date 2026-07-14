from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

class OverviewKPIs(BaseModel):
    messages_today: int
    messages_this_week: int
    active_conversations: int
    total_conversations: int
    total_customers: int
    automation_success_rate: float
    workflow_executions_today: int
    failed_executions: int
    avg_response_time_seconds: float
    avg_conversation_duration_seconds: float

class MessagesAnalytics(BaseModel):
    messages_per_day: List[Dict[str, Any]]
    messages_per_hour: List[Dict[str, Any]]
    incoming_vs_outgoing: Dict[str, int]
    automation_vs_human: Dict[str, int]
    media_vs_text: Dict[str, int]
    avg_daily_messages: float
    avg_weekly_messages: float

class ConversationsAnalytics(BaseModel):
    new_conversations: int
    closed_conversations: int
    open_conversations: int
    avg_messages_per_conversation: float
    longest_conversation_seconds: float
    fastest_response_seconds: float
    slowest_response_seconds: float
    returning_customers: int

class WorkflowsAnalytics(BaseModel):
    execution_count: int
    success_count: int
    failure_count: int
    avg_execution_time_seconds: float
    last_execution_time: Optional[datetime] = None
    top_executed_workflows: List[Dict[str, Any]]
    top_failed_workflows: List[Dict[str, Any]]
    executions_per_day: List[Dict[str, Any]]
    most_popular_trigger: Optional[str] = None
    most_used_action: Optional[str] = None

class PerformanceAnalytics(BaseModel):
    peak_messaging_hours: List[Dict[str, Any]]
    conversation_status_distribution: Dict[str, int]
    avg_response_time_trend: List[Dict[str, Any]]

class LiveEventItem(BaseModel):
    event_type: str
    workspace_id: str
    conversation_id: Optional[str] = None
    workflow_id: Optional[str] = None
    timestamp: datetime
    description: str
    details: Optional[Dict[str, Any]] = None
