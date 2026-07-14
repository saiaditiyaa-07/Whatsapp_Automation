from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Any, List, Optional
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.workspace import UserRole
from app.models.workflow import WorkflowExecutionLog, Workflow
from app.models.whatsapp import Conversation, Message, MessageDirection
from app.schemas.analytics import (
    OverviewKPIs,
    MessagesAnalytics,
    ConversationsAnalytics,
    WorkflowsAnalytics,
    PerformanceAnalytics,
    LiveEventItem
)
from app.services.analytics import AnalyticsService

router = APIRouter()

def _check_membership(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID):
    membership = db.query(deps.WorkspaceMember).filter(
        deps.WorkspaceMember.workspace_id == workspace_id,
        deps.WorkspaceMember.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )

@router.get("/overview", response_model=OverviewKPIs)
def get_overview(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve top-level KPI metrics card counts for the workspace.
    Enforces JWT authentication and workspace isolation.
    """
    _check_membership(db, workspace_id, current_user.id)
    return AnalyticsService.get_overview_kpis(db, workspace_id)

@router.get("/messages", response_model=MessagesAnalytics)
def get_messages(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    filter_type: str = Query("last_7_days", description="today, yesterday, last_7_days, last_30_days, custom"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve message volume analytics, incoming/outgoing distributions, and media counts.
    """
    _check_membership(db, workspace_id, current_user.id)
    return AnalyticsService.get_messages_analytics(db, workspace_id, filter_type, start_date, end_date)

@router.get("/conversations", response_model=ConversationsAnalytics)
def get_conversations(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    filter_type: str = Query("last_7_days"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve conversation session insights, duration, and response times.
    """
    _check_membership(db, workspace_id, current_user.id)
    return AnalyticsService.get_conversations_analytics(db, workspace_id, filter_type, start_date, end_date)

@router.get("/workflows", response_model=WorkflowsAnalytics)
def get_workflows(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    filter_type: str = Query("last_7_days"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve workflow automation execution counts, successes/failures, and popular triggers/actions.
    """
    _check_membership(db, workspace_id, current_user.id)
    return AnalyticsService.get_workflows_analytics(db, workspace_id, filter_type, start_date, end_date)

@router.get("/performance", response_model=PerformanceAnalytics)
def get_performance(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    filter_type: str = Query("last_7_days"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve messaging peak hours and status distribution.
    """
    _check_membership(db, workspace_id, current_user.id)
    return AnalyticsService.get_performance_analytics(db, workspace_id, filter_type, start_date, end_date)

@router.get("/live", response_model=List[LiveEventItem])
def get_live_events(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    limit: int = Query(25, le=100),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve recent execution logs and messages to seed the real-time Live Activity panel.
    """
    _check_membership(db, workspace_id, current_user.id)
    
    events = []
    
    # 1. Fetch recent messages
    msgs = db.query(Message).join(Conversation).filter(
        Conversation.workspace_id == workspace_id
    ).order_by(Message.timestamp.desc()).limit(limit).all()
    
    for m in msgs:
        is_inbound = m.direction == MessageDirection.INBOUND
        event_type = "new_incoming_message" if is_inbound else "agent_reply"
        desc = f"Message received from {m.conversation.customer_name or m.conversation.customer_phone}" if is_inbound else f"Reply sent to {m.conversation.customer_name or m.conversation.customer_phone}"
        
        events.append({
            "event_type": event_type,
            "workspace_id": str(workspace_id),
            "conversation_id": str(m.conversation_id),
            "timestamp": m.timestamp,
            "description": desc,
            "details": {"text": m.text, "message_type": m.message_type}
        })
        
    # 2. Fetch recent workflow executions
    execs = db.query(WorkflowExecutionLog).filter(
        WorkflowExecutionLog.workspace_id == workspace_id
    ).order_by(WorkflowExecutionLog.created_at.desc()).limit(limit).all()
    
    for e in execs:
        status_str = e.status.value.lower()
        event_type = f"workflow_{status_str}"
        desc = f"Workflow '{e.workflow.name}' executed with status {status_str.upper()}"
        
        events.append({
            "event_type": event_type,
            "workspace_id": str(workspace_id),
            "conversation_id": str(e.conversation_id) if e.conversation_id else None,
            "workflow_id": str(e.workflow_id),
            "timestamp": e.created_at,
            "description": desc,
            "details": {"status": e.status.value}
        })

    # Sort combined events by timestamp descending
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events[:limit]
