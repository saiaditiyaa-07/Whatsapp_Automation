"""
WebSocket Router – exposes two endpoints:

  /ws/conversations/{workspace_id}?token=<jwt>
      Workspace-scoped subscription. Receives:
        - conversation_created
        - conversation_updated
        - message_received  (preview / notification)
        - message_sent

  /ws/chat/{conversation_id}?token=<jwt>
      Conversation-scoped subscription. Receives:
        - message_received
        - message_sent
        - message_status_updated
        - typing_started / typing_stopped

Both endpoints:
  - Authenticate via JWT query param.
  - Enforce workspace membership (RBAC).
  - Send connection_established on accept.
  - Run a server-side heartbeat (ping/pong).
  - Cleanly remove the connection on close or error.

Business logic is intentionally absent from this file.
"""
from __future__ import annotations

import asyncio
import logging
import uuid

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.schemas.token import TokenPayload
from app.ws.events import (
    ConnectionEstablishedPayload,
    ErrorPayload,
    WSEvent,
    WSEventType,
)
from app.ws.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Auth helper (replicates deps.get_current_user without HTTP exception)
# ---------------------------------------------------------------------------

def _authenticate_ws(token: str, db: Session) -> User | None:
    """Decode JWT and return the User or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            return None
        
        # Convert token sub claim to uuid.UUID to match UUID DB models type
        user_uuid = uuid.UUID(token_data.sub)
    except (jwt.PyJWTError, ValidationError, ValueError):
        return None

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user or not user.is_active:
        return None
    return user


def _check_workspace_membership(user: User, workspace_id: str | uuid.UUID, db: Session) -> bool:
    """Return True if user is a member of the given workspace."""
    try:
        ws_uuid = uuid.UUID(str(workspace_id)) if isinstance(workspace_id, (str, uuid.UUID)) else workspace_id
    except ValueError:
        return False

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == ws_uuid,
        WorkspaceMember.user_id == user.id,
    ).first()
    return member is not None


# ---------------------------------------------------------------------------
# /ws/conversations/{workspace_id} – workspace-scoped
# ---------------------------------------------------------------------------

@router.websocket("/conversations/{workspace_id}")
async def ws_conversations(
    websocket: WebSocket,
    workspace_id: uuid.UUID,
    token: str = Query(..., description="JWT access token"),
) -> None:
    """
    WebSocket endpoint for the Conversation List panel.
    Streams: conversation_created, conversation_updated, message_received, message_sent.
    """
    db: Session = SessionLocal()
    user: User | None = None

    try:
        # 1. Authenticate
        user = _authenticate_ws(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WS /conversations rejected – invalid token")
            return

        # 2. Authorise – must be a workspace member
        ws_id = str(workspace_id)
        if not _check_workspace_membership(user, ws_id, db):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(
                "WS /conversations rejected – user=%s not a member of workspace=%s",
                user.id,
                ws_id,
            )
            return

        # 3. Accept and register
        await ws_manager.connect_workspace(websocket, ws_id)
        logger.info("WS /conversations connected user=%s workspace=%s", user.id, ws_id)

        # 4. Send connection_established
        established = WSEvent(
            type=WSEventType.CONNECTION_ESTABLISHED,
            payload=ConnectionEstablishedPayload(
                workspace_id=ws_id,
                user_id=str(user.id),
            ).model_dump(mode="json"),
        )
        await ws_manager.send_personal(websocket, established)

        # 5. Run heartbeat + message receive loop concurrently
        async def _receive_loop() -> None:
            async for message in websocket.iter_text():
                # Currently only ping→pong is handled from client
                if message.strip() == "ping":
                    from datetime import datetime
                    pong = WSEvent(
                        type=WSEventType.PONG,
                        payload={"ts": datetime.utcnow().isoformat()},
                    )
                    await ws_manager.send_personal(websocket, pong)

        heartbeat_task = asyncio.create_task(ws_manager.heartbeat(websocket))
        receive_task = asyncio.create_task(_receive_loop())

        done, pending = await asyncio.wait(
            [heartbeat_task, receive_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        logger.info("WS /conversations disconnected user=%s", user.id if user else "unknown")
    except Exception as exc:
        logger.exception("WS /conversations unexpected error: %s", exc)
    finally:
        await ws_manager.disconnect(websocket)
        db.close()


# ---------------------------------------------------------------------------
# /ws/chat/{conversation_id} – conversation-scoped
# ---------------------------------------------------------------------------

@router.websocket("/chat/{conversation_id}")
async def ws_chat(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    token: str = Query(..., description="JWT access token"),
) -> None:
    """
    WebSocket endpoint for the Chat Window panel.
    Streams: message_received, message_sent, message_status_updated, typing events.
    """
    from app.models.whatsapp import Conversation

    db: Session = SessionLocal()
    user: User | None = None

    try:
        # 1. Authenticate
        user = _authenticate_ws(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WS /chat rejected – invalid token")
            return

        # 2. Authorise – fetch conversation and verify workspace membership
        try:
            conv_uuid = uuid.UUID(str(conversation_id)) if isinstance(conversation_id, (str, uuid.UUID)) else conversation_id
        except ValueError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WS /chat rejected – invalid conversation_id format")
            return

        conv = db.query(Conversation).filter(Conversation.id == conv_uuid).first()
        if not conv:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WS /chat rejected – conversation=%s not found", conversation_id)
            return

        ws_id = str(conv.workspace_id)
        if not _check_workspace_membership(user, ws_id, db):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(
                "WS /chat rejected – user=%s not a member of workspace=%s",
                user.id,
                ws_id,
            )
            return

        # 3. Accept and register
        conv_id = str(conversation_id)
        await ws_manager.connect_chat(websocket, conv_id)
        logger.info("WS /chat connected user=%s conversation=%s", user.id, conv_id)

        # 4. Send connection_established
        established = WSEvent(
            type=WSEventType.CONNECTION_ESTABLISHED,
            payload=ConnectionEstablishedPayload(
                workspace_id=ws_id,
                user_id=str(user.id),
            ).model_dump(mode="json"),
        )
        await ws_manager.send_personal(websocket, established)

        # 5. Run heartbeat + receive loop concurrently
        async def _receive_loop() -> None:
            async for message in websocket.iter_text():
                if message.strip() == "ping":
                    from datetime import datetime
                    pong = WSEvent(
                        type=WSEventType.PONG,
                        payload={"ts": datetime.utcnow().isoformat()},
                    )
                    await ws_manager.send_personal(websocket, pong)

        heartbeat_task = asyncio.create_task(ws_manager.heartbeat(websocket))
        receive_task = asyncio.create_task(_receive_loop())

        done, pending = await asyncio.wait(
            [heartbeat_task, receive_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        logger.info("WS /chat disconnected user=%s", user.id if user else "unknown")
    except Exception as exc:
        logger.exception("WS /chat unexpected error: %s", exc)
    finally:
        await ws_manager.disconnect(websocket)
        db.close()
