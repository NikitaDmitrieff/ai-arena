from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional

from .models import Team


@dataclass
class GameResult:
    """Result of a single game in the tournament."""
    game_number: int
    winner: Optional[Team]
    starting_team: Team
    turns_played: int
    assassin_revealed: bool
    red_cards_remaining: int
    blue_cards_remaining: int
    duration_seconds: float
    red_spymaster_model: str
    red_operative_model: str
    blue_spymaster_model: str
    blue_operative_model: str


@dataclass
class ModelStats:
    """Statistics for a specific model in a specific role."""
    wins: int = 0
    losses: int = 0
    games_played: int = 0
    total_turns: int = 0
    assassin_hits: int = 0  # Times this model's team hit the assassin
    assassin_wins: int = 0  # Times this model's team won because opponent hit assassin
    
    @property
    def win_rate(self) -> float:
        return self.wins / self.games_played if self.games_played > 0 else 0.0


@dataclass
class TournamentStats:
    """Complete tournament statistics."""
    total_games: int = 0
    red_wins: int = 0
    blue_wins: int = 0
    draws: int = 0
    total_turns: int = 0
    total_duration: float = 0.0
    assassin_games: int = 0
    
    # Model performance tracking
    spymaster_stats: Dict[str, ModelStats] = field(default_factory=dict)
    operative_stats: Dict[str, ModelStats] = field(default_factory=dict)
    team_model_combinations: Dict[str, ModelStats] = field(default_factory=dict)
    
    @property
    def avg_turns_per_game(self) -> float:
        return self.total_turns / self.total_games if self.total_games > 0 else 0.0
    
    @property
    def avg_duration_per_game(self) -> float:
        return self.total_duration / self.total_games if self.total_games > 0 else 0.0
    
    @property
    def red_win_rate(self) -> float:
        return self.red_wins / self.total_games if self.total_games > 0 else 0.0
    
    @property
    def blue_win_rate(self) -> float:
        return self.blue_wins / self.total_games if self.total_games > 0 else 0.0
    
    @property
    def track_detailed_stats(self) -> bool:
        """Returns True if detailed stats are being tracked."""
        return len(self.spymaster_stats) > 0 or len(self.operative_stats) > 0


__all__ = ["GameResult", "ModelStats", "TournamentStats"]
