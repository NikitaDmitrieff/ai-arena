"""Pydantic models for API requests and responses."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    MISTRAL = "mistral"


class AgentConfig(BaseModel):
    """Configuration for an AI agent."""
    provider: LLMProvider
    model: str
    temperature: Optional[float] = None
    max_output_tokens: Optional[int] = None


class GameStartRequest(BaseModel):
    """Request to start a new game."""
    red_spymaster: AgentConfig
    red_operative: AgentConfig
    blue_spymaster: AgentConfig
    blue_operative: AgentConfig
    seed: Optional[int] = None


class ModelInfo(BaseModel):
    """Information about an available model."""
    provider: str
    model: str


class GamePhase(str, Enum):
    """Game phase enumeration."""
    AWAIT_CLUE = "await_clue"
    AWAIT_GUESS = "await_guess"
    FINISHED = "finished"


class GameStatus(BaseModel):
    """Current status of a game."""
    game_id: str
    phase: GamePhase
    current_team: str
    turn_number: int
    red_remaining: int
    blue_remaining: int
    winner: Optional[str] = None
    assassin_revealed: bool = False


class BoardCard(BaseModel):
    """Representation of a card on the board."""
    word: str
    revealed: bool
    card_type: Optional[str] = None  # Only visible if revealed or in spymaster view


class GameStateResponse(BaseModel):
    """Full game state response."""
    game_id: str
    status: GameStatus
    board: List[List[BoardCard]]
    last_clue: Optional[Dict[str, Any]] = None
    
    
class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None


class WebSocketEvent(BaseModel):
    """Base WebSocket event."""
    event_type: str
    data: Dict[str, Any]

