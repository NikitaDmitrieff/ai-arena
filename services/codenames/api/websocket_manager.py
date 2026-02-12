"""WebSocket connection manager."""

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List

from fastapi import WebSocket


class WebSocketManager:
    """Manages WebSocket connections for games."""
    
    def __init__(self):
        # Map game_id -> list of connected websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Queue for events to be sent
        self.event_queues: Dict[str, asyncio.Queue] = {}
        # Buffer for events sent before any WebSocket connects
        self.event_buffers: Dict[str, List[tuple[str, Dict[str, Any]]]] = {}
    
    def create_game_queue(self, game_id: str):
        """Create an event queue for a new game."""
        if game_id not in self.event_queues:
            self.event_queues[game_id] = asyncio.Queue()
            self.event_buffers[game_id] = []
    
    async def connect(self, game_id: str, websocket: WebSocket):
        """Connect a websocket to a game."""
        await websocket.accept()
        
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
            # Queue should already exist from game creation
            if game_id not in self.event_queues:
                self.event_queues[game_id] = asyncio.Queue()
            if game_id not in self.event_buffers:
                self.event_buffers[game_id] = []
        
        self.active_connections[game_id].append(websocket)
    
    async def send_buffered_events(self, game_id: str, websocket: WebSocket):
        """Send all buffered events to a specific websocket."""
        if game_id in self.event_buffers and self.event_buffers[game_id]:
            for event_type, data in self.event_buffers[game_id]:
                message = json.dumps({
                    "event_type": event_type,
                    "data": data
                })
                try:
                    await websocket.send_text(message)
                except Exception:
                    pass  # Connection might have closed
            # Clear the buffer after sending (only if this is the first connection)
            # We clear it so subsequent connections don't get duplicate events
            if game_id in self.active_connections and len(self.active_connections[game_id]) == 1:
                self.event_buffers[game_id] = []
    
    def disconnect(self, game_id: str, websocket: WebSocket):
        """Disconnect a websocket from a game."""
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
            
            # Clean up if no more connections
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
                # Note: Don't delete the event queue here - game might still be running
    
    def cleanup_game(self, game_id: str):
        """Clean up all resources for a game."""
        if game_id in self.active_connections:
            del self.active_connections[game_id]
        if game_id in self.event_queues:
            del self.event_queues[game_id]
        if game_id in self.event_buffers:
            del self.event_buffers[game_id]
    
    async def emit_event(self, game_id: str, event_type: str, data: Dict[str, Any]):
        """Emit an event to all connected clients for a game."""
        # If no connections yet, buffer the event
        if game_id not in self.active_connections or not self.active_connections[game_id]:
            if game_id in self.event_buffers:
                self.event_buffers[game_id].append((event_type, data))
            return
        
        message = json.dumps({
            "event_type": event_type,
            "data": data
        })
        
        # Send to all connected clients
        dead_connections = []
        for websocket in self.active_connections[game_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                dead_connections.append(websocket)
        
        # Remove dead connections
        for ws in dead_connections:
            self.disconnect(game_id, ws)
    
    def create_event_callback(self, game_id: str):
        """Create a callback function for emitting events."""
        def callback(event_type: str, data: Dict[str, Any]):
            """Callback to emit events (called from sync code)."""
            # Queue the event to be sent asynchronously
            if game_id in self.event_queues:
                try:
                    self.event_queues[game_id].put_nowait((event_type, data))
                except Exception:
                    pass  # Queue full or doesn't exist
        
        return callback
    
    async def process_events(self, game_id: str):
        """Process queued events for a game."""
        if game_id not in self.event_queues:
            return
        
        queue = self.event_queues[game_id]
        
        while True:
            try:
                event_type, data = await asyncio.wait_for(queue.get(), timeout=0.1)
                await self.emit_event(game_id, event_type, data)
            except asyncio.TimeoutError:
                # Check if game still exists (event queue still present)
                if game_id not in self.event_queues:
                    break
                continue
            except Exception:
                break

