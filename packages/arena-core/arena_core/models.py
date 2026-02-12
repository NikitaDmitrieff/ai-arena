"""Shared models for AI Arena game services."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class GameStatus(str, Enum):
    """Universal game status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class GameState(BaseModel):
    """Base game state that all services can extend."""

    game_id: str
    status: GameStatus = GameStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    error: Optional[str] = None


class WebSocketEvent(BaseModel):
    """Base WebSocket event structure."""

    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
