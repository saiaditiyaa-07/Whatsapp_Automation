"""
WebSocket Connection Manager.

Responsibilities:
- Maintain a registry of active WebSocket connections.
- Support workspace-scoped subscriptions (ConversationList).
- Support conversation-scoped subscriptions (ChatWindow).
- Broadcast events to all relevant subscribers.
- Auto-remove dead connections on send failure.
- Implement server-side heartbeat (ping/pong).
"""
from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Dict, Set

from fastapi import WebSocket

from app.ws.events import WSEvent, WSEventType, PongPayload

logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL = 30  # seconds


class ConnectionRegistry:
    """
    Maintains two subscription maps:
      workspace_id  → set[WebSocket]   (for ConversationList updates)
      conversation_id → set[WebSocket] (for ChatWindow updates)
    """

    def __init__(self) -> None:
        # workspace_id (str) → set of connected WebSocket clients
        self._workspace_subs: Dict[str, Set[WebSocket]] = defaultdict(set)
        # conversation_id (str) → set of connected WebSocket clients
        self._chat_subs: Dict[str, Set[WebSocket]] = defaultdict(set)
        # websocket → workspace_id, for efficient cleanup
        self._ws_to_workspace: Dict[WebSocket, str] = {}
        # websocket → conversation_id, for efficient cleanup
        self._ws_to_conversation: Dict[WebSocket, str] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register_workspace(self, ws: WebSocket, workspace_id: str) -> None:
        self._workspace_subs[workspace_id].add(ws)
        self._ws_to_workspace[ws] = workspace_id
        logger.debug("WS registered workspace=%s total=%d", workspace_id, len(self._workspace_subs[workspace_id]))

    def register_chat(self, ws: WebSocket, conversation_id: str) -> None:
        self._chat_subs[conversation_id].add(ws)
        self._ws_to_conversation[ws] = conversation_id
        logger.debug("WS registered chat=%s total=%d", conversation_id, len(self._chat_subs[conversation_id]))

    # ------------------------------------------------------------------
    # Removal
    # ------------------------------------------------------------------

    def remove(self, ws: WebSocket) -> None:
        workspace_id = self._ws_to_workspace.pop(ws, None)
        if workspace_id:
            self._workspace_subs[workspace_id].discard(ws)
            if not self._workspace_subs[workspace_id]:
                del self._workspace_subs[workspace_id]

        conversation_id = self._ws_to_conversation.pop(ws, None)
        if conversation_id:
            self._chat_subs[conversation_id].discard(ws)
            if not self._chat_subs[conversation_id]:
                del self._chat_subs[conversation_id]

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------

    def get_workspace_subscribers(self, workspace_id: str) -> Set[WebSocket]:
        return self._workspace_subs.get(workspace_id, set()).copy()

    def get_chat_subscribers(self, conversation_id: str) -> Set[WebSocket]:
        return self._chat_subs.get(conversation_id, set()).copy()

    def workspace_count(self, workspace_id: str) -> int:
        return len(self._workspace_subs.get(workspace_id, set()))

    def chat_count(self, conversation_id: str) -> int:
        return len(self._chat_subs.get(conversation_id, set()))


class WebSocketManager:
    """
    High-level manager wrapping ConnectionRegistry.

    Provides:
    - connect / disconnect lifecycle management
    - broadcast_workspace: send an event to all clients subscribed to a workspace
    - broadcast_conversation: send an event to all clients subscribed to a conversation
    - heartbeat loop per connected socket
    """

    def __init__(self) -> None:
        self.registry = ConnectionRegistry()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect_workspace(self, ws: WebSocket, workspace_id: str) -> None:
        await ws.accept()
        self.registry.register_workspace(ws, workspace_id)

    async def connect_chat(self, ws: WebSocket, conversation_id: str) -> None:
        await ws.accept()
        self.registry.register_chat(ws, conversation_id)

    async def disconnect(self, ws: WebSocket) -> None:
        self.registry.remove(ws)

    # ------------------------------------------------------------------
    # Broadcast helpers
    # ------------------------------------------------------------------

    async def broadcast_workspace(self, workspace_id: str, event: WSEvent) -> None:
        """Broadcast an event to all clients subscribed to a workspace."""
        dead: list[WebSocket] = []
        payload = event.to_json()
        for ws in self.registry.get_workspace_subscribers(workspace_id):
            try:
                await ws.send_text(payload)
            except Exception:
                logger.warning("Dead WS in workspace=%s; scheduling removal.", workspace_id)
                dead.append(ws)
        for ws in dead:
            self.registry.remove(ws)

    async def broadcast_conversation(self, conversation_id: str, event: WSEvent) -> None:
        """Broadcast an event to all clients subscribed to a conversation."""
        dead: list[WebSocket] = []
        payload = event.to_json()
        for ws in self.registry.get_chat_subscribers(conversation_id):
            try:
                await ws.send_text(payload)
            except Exception:
                logger.warning("Dead WS in conversation=%s; scheduling removal.", conversation_id)
                dead.append(ws)
        for ws in dead:
            self.registry.remove(ws)

    async def send_personal(self, ws: WebSocket, event: WSEvent) -> None:
        """Send an event to a single WebSocket client."""
        try:
            await ws.send_text(event.to_json())
        except Exception:
            self.registry.remove(ws)

    # ------------------------------------------------------------------
    # Heartbeat
    # ------------------------------------------------------------------

    async def heartbeat(self, ws: WebSocket) -> None:
        """Ping the client every HEARTBEAT_INTERVAL seconds."""
        from datetime import datetime

        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            pong_event = WSEvent(
                type=WSEventType.PONG,
                payload=PongPayload(ts=datetime.utcnow()).model_dump(mode="json"),
            )
            try:
                await ws.send_text(pong_event.to_json())
            except Exception:
                # Client disconnected; the main handler will clean up.
                break


# ---------------------------------------------------------------------------
# Singleton – imported by the router, broadcaster, and service layer
# ---------------------------------------------------------------------------
ws_manager = WebSocketManager()
