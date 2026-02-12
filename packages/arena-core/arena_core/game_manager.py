"""Base game manager for concurrent game execution."""

from __future__ import annotations

import asyncio
import logging
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional

from arena_core.models import GameStatus

logger = logging.getLogger(__name__)


class GameManager(ABC):
    """Abstract base for managing game lifecycle.

    Provides in-memory game storage, creation, listing, and deletion.
    Subclasses implement ``run_game`` with game-specific execution logic.

    Game status lifecycle: PENDING -> RUNNING -> COMPLETED | FAILED
    """

    def __init__(self):
        self.games: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    def generate_id(self) -> str:
        return str(uuid.uuid4())

    async def create_game(self, **kwargs) -> str:
        """Create a new game and return its ID.

        Subclasses should override to build their specific game state,
        call ``super().create_game()`` is not required — just store in
        ``self.games[game_id]``.
        """
        game_id = self.generate_id()
        return game_id

    def get_game(self, game_id: str) -> Optional[Any]:
        """Get game state by ID."""
        return self.games.get(game_id)

    def list_games(self) -> List[str]:
        """List all game IDs."""
        return list(self.games.keys())

    def delete_game(self, game_id: str) -> bool:
        """Delete a game. Returns True if the game existed."""
        if game_id in self.games:
            del self.games[game_id]
            return True
        return False

    @abstractmethod
    async def run_game(self, game_id: str) -> Any:
        """Execute a game asynchronously. Implement in subclass."""
        ...
