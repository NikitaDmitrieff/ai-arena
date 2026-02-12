from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from random import Random
from typing import Any, Dict, Optional
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# Load environment variables from .env file
load_dotenv(dotenv_path=ROOT / ".env")

from codenames.ai_match import AIMatch
from codenames.game import Game
from codenames.models import Team
from codenames.tournament import Tournament
from codenames.words import ensure_word_count, load_words

CONFIG_PATH = ROOT / "simulation_config.json"


@dataclass
class AgentConfig:
    provider: Optional[str]
    model: Optional[str]
    temperature: float
    max_output_tokens: int


@dataclass
class TournamentConfig:
    enabled: bool
    num_games: int
    randomize_starting_team: bool
    track_detailed_stats: bool


@dataclass
class GameConfig:
    seed: Optional[int]
    word_list_path: Path
    minimum_word_count: int
    verbose: bool
    simple_logging: bool
    agents: Dict[Team, Dict[str, AgentConfig]]
    tournament: TournamentConfig


def load_config(path: Path) -> GameConfig:
    if not path.exists():
        raise FileNotFoundError(f"Simulation config not found at {path}")
    data = json.loads(path.read_text())
    game_cfg = data.get("game", {})
    seed = game_cfg.get("seed")
    word_list_path = ROOT / game_cfg.get("word_list_path", "words.txt")
    minimum_word_count = game_cfg.get("minimum_word_count", 400)

    output_cfg = data.get("output", {})
    verbose = output_cfg.get("verbose", True)
    simple_logging = output_cfg.get("simple_logging", False)

    tournament_cfg = data.get("tournament", {})
    tournament = TournamentConfig(
        enabled=tournament_cfg.get("enabled", False),
        num_games=tournament_cfg.get("num_games", 10),
        randomize_starting_team=tournament_cfg.get("randomize_starting_team", True),
        track_detailed_stats=tournament_cfg.get("track_detailed_stats", True)
    )

    agents_cfg = data.get("agents", {})
    agent_settings: Dict[Team, Dict[str, AgentConfig]] = {
        Team.RED: {
            "spymaster": _parse_agent_config(agents_cfg.get("red_spymaster", {}), 0.6),
            "operatives": _parse_agent_config(agents_cfg.get("red_operatives", {}), 0.5),
        },
        Team.BLUE: {
            "spymaster": _parse_agent_config(agents_cfg.get("blue_spymaster", {}), 0.6),
            "operatives": _parse_agent_config(agents_cfg.get("blue_operatives", {}), 0.5),
        },
    }

    return GameConfig(
        seed=seed,
        word_list_path=word_list_path,
        minimum_word_count=minimum_word_count,
        verbose=verbose,
        simple_logging=simple_logging,
        agents=agent_settings,
        tournament=tournament,
    )


def _parse_agent_config(raw: Dict[str, Any], default_temp: float) -> AgentConfig:
    return AgentConfig(
        provider=raw.get("provider"),
        model=raw.get("model"),
        temperature=float(raw.get("temperature", default_temp)),
        max_output_tokens=int(raw.get("max_output_tokens", 320)),
    )


def apply_agent_overrides(match: AIMatch, config: GameConfig) -> None:
    try:
        from nikitas_agents import BaseAgent
    except ImportError as exc:
        raise RuntimeError("nikitas-agents package is required to configure agents") from exc

    for team, roles in config.agents.items():
        team_agents = match.team_agents[team]
        for role_name, persona in (
            ("spymaster", team_agents.spymaster),
            ("operatives", team_agents.operative),
        ):
            overrides = roles[role_name]
            existing_agent = persona.agent
            kwargs = {
                "name": getattr(existing_agent, "name", f"{team.name} {role_name.title()}"),
                "description": getattr(existing_agent, "description", ""),
            }
            provider = overrides.provider if overrides.provider is not None else getattr(existing_agent, "provider", None)
            model = overrides.model if overrides.model is not None else getattr(existing_agent, "model", None)
            if overrides.provider is not None or overrides.model is not None:
                if provider is not None:
                    kwargs["provider"] = provider
                if model is not None:
                    kwargs["model"] = model
                persona.agent = BaseAgent(**kwargs)
            persona.temperature = overrides.temperature
            persona.max_output_tokens = overrides.max_output_tokens
    match.verbose = config.verbose
    match.simple_logging = config.simple_logging


def main() -> None:
    config = load_config(CONFIG_PATH)
    
    if config.tournament.enabled:
        # Run tournament mode
        results_path = ROOT / "results"  # Create results folder in project root
        tournament = Tournament(
            num_games=config.tournament.num_games,
            word_list_path=config.word_list_path,
            minimum_word_count=config.minimum_word_count,
            randomize_starting_team=config.tournament.randomize_starting_team,
            track_detailed_stats=config.tournament.track_detailed_stats,
            verbose=config.verbose,
            seed=config.seed,
            results_base_path=results_path
        )
        
        stats = tournament.run(config)
        
        # Save results with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_path = ROOT / f"tournament_results_{timestamp}.json"
        tournament.save_results(results_path)
        
    else:
        # Run single game mode
        from datetime import datetime
        from pathlib import Path
        from game_logging.llm_logger import LLMMessageLogger
        
        rng = Random(config.seed)
        words = load_words(str(config.word_list_path))
        ensure_word_count(words, config.minimum_word_count)
        game = Game.new_standard(words, rng)
        
        # Set up LLM logging for single game
        results_path = ROOT / "results"
        results_path.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        single_game_folder = results_path / f"single_game_{timestamp}"
        single_game_folder.mkdir(exist_ok=True)
        
        llm_logger = LLMMessageLogger(single_game_folder)
        
        # Set up simple log file if simple logging is enabled
        simple_log_file = None
        if config.simple_logging:
            simple_log_file = single_game_folder / "simple_game_log.txt"
        
        match = AIMatch(game, verbose=config.verbose, simple_logging=config.simple_logging, simple_log_file=simple_log_file, llm_logger=llm_logger)
        
        # Start game logging
        llm_logger.start_game(1)
        
        apply_agent_overrides(match, config)
        winner = match.play()
        
        # End game logging and save
        winner_name = winner.name if winner else None
        llm_logger.end_game(winner_name, match.turn_counter - 1)
        llm_logger.save_all_conversations()
        
        print(f"\n💬 LLM conversation logs saved to: {single_game_folder / 'llm_conversations'}")
        if config.simple_logging:
            print(f"📝 Simple game log saved to: {simple_log_file}")


if __name__ == "__main__":
    main()
