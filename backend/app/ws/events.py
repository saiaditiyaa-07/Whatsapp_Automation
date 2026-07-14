"""
WebSocket event schemas – typed Pydantic models for every event
that can be broadcast to connected dashboard clients.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class WSEventType(str, enum.Enum):
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_CLOSED = "connection_closed"
    CONVERSATION_CREATED = "conversation_created"
    CONVERSATION_UPDATED = "conversation_updated"
    MESSAGE_RECEIVED = "message_received"
    MESSAGE_SENT = "message_sent"
    MESSAGE_STATUS_UPDATED = "message_status_updated"
    TYPING_STARTED = "typing_started"
    TYPING_STOPPED = "typing_stopped"
    PING = "ping"
    PONG = "pong"
    ERROR = "error"
    WORKFLOW_EXECUTED = "workflow_executed"
    WORKFLOW_FAILED = "workflow_failed"
    AUTOMATION_TRIGGERED = "automation_triggered"
    CONVERSATION_CLOSED = "conversation_closed"


class WSEvent(BaseModel):
    """Top-level envelope for every WebSocket message."""
    type: WSEventType
    payload: Any
    ts: Optional[datetime] = None

    def model_post_init(self, __context: Any) -> None:
        if self.ts is None:
            object.__setattr__(self, 'ts', datetime.utcnow())

    def to_json(self) -> str:
        return self.model_dump_json()


# ---------------------------------------------------------------------------
# Payload schemas
# ---------------------------------------------------------------------------

class ConnectionEstablishedPayload(BaseModel):
    workspace_id: str
    user_id: str


class ConversationPayload(BaseModel):
    id: str
    workspace_id: str
    customer_name: Optional[str]
    customer_phone: str
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    is_archived: bool
    unread_count: int
    created_at: datetime


class MessagePayload(BaseModel):
    id: str
    conversation_id: str
    meta_message_id: Optional[str]
    direction: str
    message_type: str
    text: str
    status: str
    timestamp: datetime


class MessageStatusPayload(BaseModel):
    message_id: str
    conversation_id: str
    status: str


class TypingPayload(BaseModel):
    conversation_id: str
    user_id: Optional[str] = None


class PongPayload(BaseModel):
    ts: datetime


class ErrorPayload(BaseModel):
    code: int
    detail: str
