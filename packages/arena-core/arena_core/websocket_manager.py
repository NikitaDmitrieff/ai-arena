"""Unified WebSocket connection manager for real-time game events."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Callable

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections for real-time game updates.

    Supports per-game connection tracking, event buffering for events
    emitted before any client connects, and async event queues for
    bridging sync game code to async WebSocket delivery.
    """

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.event_queues: dict[str, asyncio.Queue] = {}
        self.event_buffers: dict[str, list[tuple[str, dict[str, Any]]]] = {}

    def create_game_queue(self, game_id: str) -> None:
        """Create an event queue and buffer for a new game."""
        if game_id not in self.event_queues:
            self.event_queues[game_id] = asyncio.Queue()
            self.event_buffers[game_id] = []

    async def connect(self, game_id: str, websocket: WebSocket) -> None:
        """Accept and register a WebSocket connection for a game."""
        await websocket.accept()
        self.create_game_queue(game_id)
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)
        logger.info(
            f"WebSocket connected for game {game_id}. "
            f"Total: {len(self.active_connections[game_id])}"
        )

    def disconnect(self, game_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
                logger.info(
                    f"WebSocket disconnected for game {game_id}. "
                    f"Remaining: {len(self.active_connections[game_id])}"
                )
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    def cleanup_game(self, game_id: str) -> None:
        """Clean up all resources for a game."""
        self.active_connections.pop(game_id, None)
        self.event_queues.pop(game_id, None)
        self.event_buffers.pop(game_id, None)

    async def broadcast(self, game_id: str, message: dict) -> None:
        """Broadcast a raw message dict to all connected clients for a game."""
        if game_id not in self.active_connections:
            return
        dead = []
        for ws in self.active_connections[game_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(game_id, ws)

    async def send_event(
        self, game_id: str, event_type: str, data: dict
    ) -> None:
        """Send a structured event to all clients watching a game.

        If no clients are connected, the event is buffered and will be
        delivered when a client connects via ``send_buffered_events``.
        """
        if (
            game_id not in self.active_connections
            or not self.active_connections[game_id]
        ):
            if game_id in self.event_buffers:
                self.event_buffers[game_id].append((event_type, data))
            return
        message = {
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }
        await self.broadcast(game_id, message)

    async def send_buffered_events(
        self, game_id: str, websocket: WebSocket
    ) -> None:
        """Replay buffered events to a newly connected client."""
        if game_id not in self.event_buffers or not self.event_buffers[game_id]:
            return
        for event_type, data in self.event_buffers[game_id]:
            try:
                await websocket.send_json({"event_type": event_type, "data": data})
            except Exception:
                pass
        # Clear buffer after first client receives them
        if (
            game_id in self.active_connections
            and len(self.active_connections[game_id]) == 1
        ):
            self.event_buffers[game_id] = []

    def create_event_callback(self, game_id: str) -> Callable:
        """Create a sync callback that queues events for async delivery.

        Use this to bridge synchronous game code running in an executor
        with the async WebSocket event loop.
        """

        def callback(event_type: str, data: dict[str, Any]) -> None:
            if game_id in self.event_queues:
                try:
                    self.event_queues[game_id].put_nowait((event_type, data))
                except Exception:
                    pass

        return callback

    async def process_events(self, game_id: str) -> None:
        """Process queued events for a game until the queue is removed."""
        if game_id not in self.event_queues:
            return
        queue = self.event_queues[game_id]
        while True:
            try:
                event_type, data = await asyncio.wait_for(
                    queue.get(), timeout=0.1
                )
                await self.send_event(game_id, event_type, data)
            except asyncio.TimeoutError:
                if game_id not in self.event_queues:
                    break
                continue
            except Exception:
                break
