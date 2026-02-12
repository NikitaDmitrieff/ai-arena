"""Game manager for tracking active games."""

from __future__ import annotations

import asyncio
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from random import Random
from typing import Any, Callable, Dict, Optional

# Add src directory to path for imports (needed for game_logging, prompts, etc.)
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from codenames.ai_match import AIMatch
from codenames.game import Game
from codenames.models import Team
from codenames.words import ensure_word_count, load_words


@dataclass
class GameInstance:
    """Represents an active game instance."""
    game_id: str
    game: Game
    match: AIMatch
    task: Optional[asyncio.Task] = None
    event_callback: Optional[Callable] = None


class GameManager:
    """Manages active games."""
    
    def __init__(self, word_list_path: Path, minimum_word_count: int = 400):
        self.games: Dict[str, GameInstance] = {}
        self.word_list_path = word_list_path
        self.minimum_word_count = minimum_word_count
        self.words = load_words(str(word_list_path))
        ensure_word_count(self.words, minimum_word_count)
    
    def create_game(
        self,
        agent_configs: Dict[str, Any],
        seed: Optional[int] = None,
        event_callback: Optional[Callable] = None
    ) -> str:
        """Create a new game and return its ID."""
        game_id = str(uuid.uuid4())
        rng = Random(seed)
        
        # Create game
        game = Game.new_standard(self.words, rng)
        
        # Create AI match without logging for now
        match = AIMatch(game, verbose=False, simple_logging=False)
        
        # Apply agent configurations
        self._apply_agent_configs(match, agent_configs)
        
        # Store game instance
        instance = GameInstance(
            game_id=game_id,
            game=game,
            match=match,
            event_callback=event_callback
        )
        self.games[game_id] = instance
        
        return game_id
    
    def _apply_agent_configs(self, match: AIMatch, configs: Dict[str, Any]) -> None:
        """Apply agent configurations to the match."""
        try:
            from nikitas_agents import BaseAgent
        except ImportError as exc:
            raise RuntimeError("nikitas-agents package is required") from exc
        
        config_map = {
            (Team.RED, "spymaster"): configs.get("red_spymaster"),
            (Team.RED, "operative"): configs.get("red_operative"),
            (Team.BLUE, "spymaster"): configs.get("blue_spymaster"),
            (Team.BLUE, "operative"): configs.get("blue_operative"),
        }
        
        for (team, role), config in config_map.items():
            if not config:
                continue
                
            team_agents = match.team_agents[team]
            persona = team_agents.spymaster if role == "spymaster" else team_agents.operative
            
            # Create new agent with specified provider/model
            agent_name = f"{team.name.title()} {role.title()}"
            persona.agent = BaseAgent(
                name=agent_name,
                description=f"{role.title()} for {team.name} team",
                provider=config["provider"],
                model=config["model"]
            )
            
            # Apply optional parameters
            if "temperature" in config and config["temperature"] is not None:
                persona.temperature = config["temperature"]
            if "max_output_tokens" in config and config["max_output_tokens"] is not None:
                persona.max_output_tokens = config["max_output_tokens"]
    
    async def run_game(self, game_id: str) -> Optional[str]:
        """Run a game in the background and return winner."""
        instance = self.games.get(game_id)
        if not instance:
            return None
        
        # Set up event emission
        if instance.event_callback:
            instance.match._event_callback = instance.event_callback
        
        # Run game in executor (blocking operation)
        loop = asyncio.get_event_loop()
        winner = await loop.run_in_executor(None, instance.match.play)
        
        return winner.name if winner else None
    
    def get_game(self, game_id: str) -> Optional[GameInstance]:
        """Get a game instance by ID."""
        return self.games.get(game_id)
    
    def list_games(self) -> list[str]:
        """List all active game IDs."""
        return list(self.games.keys())
    
    def delete_game(self, game_id: str) -> bool:
        """Delete a game instance."""
        if game_id in self.games:
            instance = self.games[game_id]
            if instance.task and not instance.task.done():
                instance.task.cancel()
            del self.games[game_id]
            return True
        return False

