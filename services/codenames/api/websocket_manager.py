"""Re-export WebSocketManager from arena-core for backward compatibility."""

from arena_core import WebSocketManager

# Global WebSocket manager instance
ws_manager = WebSocketManager()
