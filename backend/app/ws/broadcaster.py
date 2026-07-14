"""
EventBroadcaster – thin façade that converts ORM objects into typed
WebSocket events and dispatches them via the WebSocketManager singleton.

Business logic MUST remain in the service layer.
This module is purely concerned with event serialisation and dispatch.
"""
from __future__ import annotations

import logging
from typing import Optional
import uuid

from app.models.whatsapp import Conversation, Message
from app.ws.events import (
    WSEvent,
    WSEventType,
    ConversationPayload,
    MessagePayload,
)
from app.ws.manager import ws_manager

logger = logging.getLogger(__name__)


def _conversation_payload(conv: Conversation) -> dict:
    return ConversationPayload(
        id=str(conv.id),
        workspace_id=str(conv.workspace_id),
        customer_name=conv.customer_name,
        customer_phone=conv.customer_phone,
        last_message=conv.last_message,
        last_message_time=conv.last_message_time,
        is_archived=conv.is_archived,
        unread_count=conv.unread_count,
        created_at=conv.created_at,
    ).model_dump(mode="json")


def _message_payload(msg: Message) -> dict:
    return MessagePayload(
        id=str(msg.id),
        conversation_id=str(msg.conversation_id),
        meta_message_id=msg.meta_message_id,
        direction=msg.direction.value,
        message_type=msg.message_type,
        text=msg.text,
        status=msg.status,
        timestamp=msg.timestamp,
    ).model_dump(mode="json")


class EventBroadcaster:
    """
    Centralised broadcaster used by webhook handler and REST reply endpoint.
    All public methods are async coroutines and safe to call from any
    FastAPI async context.
    """

    async def broadcast_incoming_message(
        self,
        workspace_id: uuid.UUID,
        conversation: Conversation,
        message: Message,
        is_new_conversation: bool = False,
    ) -> None:
        """Broadcast a newly received inbound message from a customer."""
        ws_id = str(workspace_id)
        conv_id = str(conversation.id)

        # 1. Broadcast conversation event to workspace subscribers
        conv_event_type = (
            WSEventType.CONVERSATION_CREATED if is_new_conversation
            else WSEventType.CONVERSATION_UPDATED
        )
        conv_event = WSEvent(
            type=conv_event_type,
            payload=_conversation_payload(conversation),
        )
        await ws_manager.broadcast_workspace(ws_id, conv_event)

        # 2. Broadcast message to workspace subscribers (for notification/preview)
        msg_event = WSEvent(
            type=WSEventType.MESSAGE_RECEIVED,
            payload=_message_payload(message),
        )
        await ws_manager.broadcast_workspace(ws_id, msg_event)

        # 3. Broadcast message directly to chat-window subscribers
        await ws_manager.broadcast_conversation(conv_id, msg_event)

        logger.info(
            "Broadcasted incoming message=%s to workspace=%s conv=%s",
            message.id,
            ws_id,
            conv_id,
        )

    async def broadcast_outgoing_message(
        self,
        workspace_id: uuid.UUID,
        conversation: Conversation,
        message: Message,
    ) -> None:
        """Broadcast a sent outbound message from an agent."""
        ws_id = str(workspace_id)
        conv_id = str(conversation.id)

        # 1. Update conversation preview for all workspace subscribers
        conv_event = WSEvent(
            type=WSEventType.CONVERSATION_UPDATED,
            payload=_conversation_payload(conversation),
        )
        await ws_manager.broadcast_workspace(ws_id, conv_event)

        # 2. Broadcast sent message to chat-window subscribers
        msg_event = WSEvent(
            type=WSEventType.MESSAGE_SENT,
            payload=_message_payload(message),
        )
        await ws_manager.broadcast_workspace(ws_id, msg_event)
        await ws_manager.broadcast_conversation(conv_id, msg_event)

        logger.info(
            "Broadcasted outgoing message=%s to workspace=%s conv=%s",
            message.id,
            ws_id,
            conv_id,
        )

    async def broadcast_workflow_execution(
        self,
        workspace_id: uuid.UUID,
        workflow_id: uuid.UUID,
        workflow_name: str,
        status: str,
        conversation_id: Optional[uuid.UUID] = None
    ) -> None:
        """Broadcast a workflow execution logs event to workspace subscribers."""
        event_type = WSEventType.WORKFLOW_EXECUTED if status.upper() == "SUCCESS" else WSEventType.WORKFLOW_FAILED
        payload = {
            "workflow_id": str(workflow_id),
            "workflow_name": workflow_name,
            "status": status.upper(),
            "conversation_id": str(conversation_id) if conversation_id else None,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Workflow '{workflow_name}' executed with status {status.upper()}"
        }
        event = WSEvent(type=event_type, payload=payload)
        await ws_manager.broadcast_workspace(str(workspace_id), event)

    async def broadcast_automation_triggered(
        self,
        workspace_id: uuid.UUID,
        workflow_id: uuid.UUID,
        workflow_name: str
    ) -> None:
        """Broadcast an automation trigger match event."""
        payload = {
            "workflow_id": str(workflow_id),
            "workflow_name": workflow_name,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Automation triggered for workflow '{workflow_name}'"
        }
        event = WSEvent(type=WSEventType.AUTOMATION_TRIGGERED, payload=payload)
        await ws_manager.broadcast_workspace(str(workspace_id), event)

    async def broadcast_conversation_closed(
        self,
        workspace_id: uuid.UUID,
        conversation_id: uuid.UUID,
        customer_name: str
    ) -> None:
        """Broadcast conversation close/archived events."""
        payload = {
            "conversation_id": str(conversation_id),
            "customer_name": customer_name,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Conversation with {customer_name} was closed"
        }
        event = WSEvent(type=WSEventType.CONVERSATION_CLOSED, payload=payload)
        await ws_manager.broadcast_workspace(str(workspace_id), event)

    async def broadcast_message_status(
        self,
        workspace_id: uuid.UUID,
        conversation_id: uuid.UUID,
        message_id: uuid.UUID,
        status: str,
    ) -> None:
        """Broadcast status update events (sent, delivered, read, failed) for a message."""
        from app.ws.events import MessageStatusPayload
        payload = MessageStatusPayload(
            message_id=str(message_id),
            conversation_id=str(conversation_id),
            status=status.lower()
        ).model_dump(mode="json")
        
        event = WSEvent(
            type=WSEventType.MESSAGE_STATUS_UPDATED,
            payload=payload
        )
        await ws_manager.broadcast_workspace(str(workspace_id), event)
        await ws_manager.broadcast_conversation(str(conversation_id), event)


# Singleton instance imported by route handlers
broadcaster = EventBroadcaster()
