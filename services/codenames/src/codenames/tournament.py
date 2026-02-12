from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from random import Random
from typing import Dict, List, Optional, Tuple

from .ai_match import AIMatch
from game_logging.csv_logger import CSVLogger
from .game import Game
from game_logging.llm_logger import LLMMessageLogger
from .models import Team
from .tournament_models import GameResult, ModelStats, TournamentStats
from .words import ensure_word_count, load_words


class Tournament:
    """Manages multiple games and tracks comprehensive statistics."""
    
    def __init__(self, 
                 num_games: int,
                 word_list_path: Path,
                 minimum_word_count: int,
                 randomize_starting_team: bool = True,
                 track_detailed_stats: bool = True,
                 verbose: bool = True,
                 seed: Optional[int] = None,
                 results_base_path: Optional[Path] = None):
        self.num_games = num_games
        self.word_list_path = word_list_path
        self.minimum_word_count = minimum_word_count
        self.randomize_starting_team = randomize_starting_team
        self.track_detailed_stats = track_detailed_stats
        self.verbose = verbose
        self.seed = seed
        
        # Set up results directory
        if results_base_path is None:
            results_base_path = Path.cwd() / "results"
        self.results_base_path = results_base_path
        self.csv_logger = CSVLogger(results_base_path)
        
        # Set up LLM message logger
        self.llm_logger = LLMMessageLogger(self.csv_logger.create_session_folder())
        
        self.rng = Random(seed)
        self.words = load_words(str(word_list_path))
        ensure_word_count(self.words, minimum_word_count)
        
        self.results: List[GameResult] = []
        self.stats = TournamentStats()
        self.config_dict: Dict = {}  # Store config for logging
    
    def run(self, game_config) -> TournamentStats:
        """Run the complete tournament and return final statistics."""
        # Store config for logging
        self.config_dict = self._extract_config_for_logging(game_config)
        
        self._log(f"🏆 Starting tournament: {self.num_games} games")
        self._log(f"   Seed: {self.seed}")
        self._log(f"   Randomize starting team: {self.randomize_starting_team}")
        self._log(f"   Results will be saved to: {self.csv_logger.create_session_folder()}")
        
        start_time = time.time()
        
        for game_num in range(1, self.num_games + 1):
            self._log(f"\n{'='*60}")
            self._log(f"🎮 Game {game_num}/{self.num_games}")
            self._log(f"{'='*60}")
            
            result = self._run_single_game(game_num, game_config)
            self.results.append(result)
            self._update_stats(result)
            
            if self.verbose:
                self._print_game_summary(result)
        
        total_time = time.time() - start_time
        self.stats.total_duration = total_time
        
        self._print_final_results()
        
        # Save all results to CSV
        self._save_csv_results()
        
        # Save LLM conversation logs
        self._save_llm_conversations()
        
        return self.stats
    
    def _run_single_game(self, game_num: int, game_config) -> GameResult:
        """Run a single game and return its result."""
        # Determine starting team
        if self.randomize_starting_team:
            starting_team = self.rng.choice([Team.RED, Team.BLUE])
        else:
            starting_team = Team.RED
        
        # Create game
        game = Game.new_standard(self.words, self.rng)
        game.starting_team = starting_team
        game.current_team = starting_team
        
        # Create match with controlled verbosity during tournament
        # Only show verbose output for single games or when explicitly requested
        game_verbose = self.verbose and (self.num_games == 1)
        match = AIMatch(game, verbose=game_verbose, llm_logger=self.llm_logger)
        
        # Start game logging
        self.llm_logger.start_game(game_num)
        
        # Apply agent configuration
        from main import apply_agent_overrides  # Import here to avoid circular imports
        apply_agent_overrides(match, game_config)
        
        # Track game timing
        game_start = time.time()
        
        # Run the game
        winner = match.play()
        
        game_duration = time.time() - game_start
        
        # End game logging
        winner_name = winner.name if winner else None
        self.llm_logger.end_game(winner_name, match.turn_counter - 1)
        
        # Extract model information
        red_agents = match.team_agents[Team.RED]
        blue_agents = match.team_agents[Team.BLUE]
        
        red_spy_model = self._get_model_name(red_agents.spymaster.agent)
        red_op_model = self._get_model_name(red_agents.operative.agent)
        blue_spy_model = self._get_model_name(blue_agents.spymaster.agent)
        blue_op_model = self._get_model_name(blue_agents.operative.agent)
        
        return GameResult(
            game_number=game_num,
            winner=winner,
            starting_team=starting_team,
            turns_played=match.turn_counter - 1,
            assassin_revealed=game.assassin_revealed,
            red_cards_remaining=game.remaining[Team.RED],
            blue_cards_remaining=game.remaining[Team.BLUE],
            duration_seconds=game_duration,
            red_spymaster_model=red_spy_model,
            red_operative_model=red_op_model,
            blue_spymaster_model=blue_spy_model,
            blue_operative_model=blue_op_model
        )
    
    def _get_model_name(self, agent) -> str:
        """Extract model name from agent."""
        provider = getattr(agent, 'provider', 'unknown')
        model = getattr(agent, 'model', 'unknown')
        return f"{provider}/{model}"
    
    def _update_stats(self, result: GameResult):
        """Update tournament statistics with the result of a single game."""
        self.stats.total_games += 1
        self.stats.total_turns += result.turns_played
        
        if result.winner == Team.RED:
            self.stats.red_wins += 1
        elif result.winner == Team.BLUE:
            self.stats.blue_wins += 1
        else:
            self.stats.draws += 1
        
        if result.assassin_revealed:
            self.stats.assassin_games += 1
        
        if self.track_detailed_stats:
            self._update_model_stats(result)
    
    def _update_model_stats(self, result: GameResult):
        """Update detailed model statistics."""
        # Initialize model stats if needed
        models = [
            result.red_spymaster_model, result.red_operative_model,
            result.blue_spymaster_model, result.blue_operative_model
        ]
        
        for model in models:
            if model not in self.stats.spymaster_stats:
                self.stats.spymaster_stats[model] = ModelStats()
            if model not in self.stats.operative_stats:
                self.stats.operative_stats[model] = ModelStats()
        
        # Update spymaster stats
        red_spy_stats = self.stats.spymaster_stats[result.red_spymaster_model]
        blue_spy_stats = self.stats.spymaster_stats[result.blue_spymaster_model]
        
        red_spy_stats.games_played += 1
        blue_spy_stats.games_played += 1
        red_spy_stats.total_turns += result.turns_played
        blue_spy_stats.total_turns += result.turns_played
        
        # Update operative stats
        red_op_stats = self.stats.operative_stats[result.red_operative_model]
        blue_op_stats = self.stats.operative_stats[result.blue_operative_model]
        
        red_op_stats.games_played += 1
        blue_op_stats.games_played += 1
        red_op_stats.total_turns += result.turns_played
        blue_op_stats.total_turns += result.turns_played
        
        # Update wins/losses and assassin stats
        if result.winner == Team.RED:
            red_spy_stats.wins += 1
            red_op_stats.wins += 1
            blue_spy_stats.losses += 1
            blue_op_stats.losses += 1
            
            if result.assassin_revealed:
                # Blue team hit the assassin, so red team gets assassin win
                red_spy_stats.assassin_wins += 1
                red_op_stats.assassin_wins += 1
                blue_spy_stats.assassin_hits += 1
                blue_op_stats.assassin_hits += 1
                
        elif result.winner == Team.BLUE:
            blue_spy_stats.wins += 1
            blue_op_stats.wins += 1
            red_spy_stats.losses += 1
            red_op_stats.losses += 1
            
            if result.assassin_revealed:
                # Red team hit the assassin, so blue team gets assassin win
                blue_spy_stats.assassin_wins += 1
                blue_op_stats.assassin_wins += 1
                red_spy_stats.assassin_hits += 1
                red_op_stats.assassin_hits += 1
        
        # Track team combinations
        red_combo = f"R:{result.red_spymaster_model}+{result.red_operative_model}"
        blue_combo = f"B:{result.blue_spymaster_model}+{result.blue_operative_model}"
        
        if red_combo not in self.stats.team_model_combinations:
            self.stats.team_model_combinations[red_combo] = ModelStats()
        if blue_combo not in self.stats.team_model_combinations:
            self.stats.team_model_combinations[blue_combo] = ModelStats()
        
        red_combo_stats = self.stats.team_model_combinations[red_combo]
        blue_combo_stats = self.stats.team_model_combinations[blue_combo]
        
        red_combo_stats.games_played += 1
        blue_combo_stats.games_played += 1
        
        if result.winner == Team.RED:
            red_combo_stats.wins += 1
            blue_combo_stats.losses += 1
        elif result.winner == Team.BLUE:
            blue_combo_stats.wins += 1
            red_combo_stats.losses += 1
    
    def _print_game_summary(self, result: GameResult):
        """Print a summary of a single game result."""
        winner_str = result.winner.name if result.winner else "DRAW"
        assassin_str = " (Assassin!)" if result.assassin_revealed else ""
        
        self._log(f"   Result: {winner_str} wins in {result.turns_played} turns{assassin_str}")
        self._log(f"   Duration: {result.duration_seconds:.1f}s")
        self._log(f"   Starting team: {result.starting_team.name}")
        
        if self.track_detailed_stats:
            self._log(f"   Red team: {result.red_spymaster_model} + {result.red_operative_model}")
            self._log(f"   Blue team: {result.blue_spymaster_model} + {result.blue_operative_model}")
    
    def _print_final_results(self):
        """Print comprehensive tournament results."""
        self._log(f"\n{'='*80}")
        self._log(f"🏆 TOURNAMENT RESULTS")
        self._log(f"{'='*80}")
        
        # Overall statistics
        self._log(f"\n📊 OVERALL STATISTICS:")
        self._log(f"   Total games: {self.stats.total_games}")
        self._log(f"   Red wins: {self.stats.red_wins} ({self.stats.red_win_rate:.1%})")
        self._log(f"   Blue wins: {self.stats.blue_wins} ({self.stats.blue_win_rate:.1%})")
        if self.stats.draws > 0:
            self._log(f"   Draws: {self.stats.draws}")
        self._log(f"   Average turns per game: {self.stats.avg_turns_per_game:.1f}")
        self._log(f"   Average duration per game: {self.stats.avg_duration_per_game:.1f}s")
        self._log(f"   Games with assassin: {self.stats.assassin_games} ({self.stats.assassin_games/self.stats.total_games:.1%})")
        self._log(f"   Total tournament time: {self.stats.total_duration:.1f}s")
        
        if self.track_detailed_stats:
            self._print_model_performance()
    
    def _print_model_performance(self):
        """Print detailed model performance statistics."""
        self._log(f"\n🤖 SPYMASTER PERFORMANCE:")
        spymaster_items = sorted(self.stats.spymaster_stats.items(), 
                                key=lambda x: x[1].win_rate, reverse=True)
        
        for model, stats in spymaster_items:
            self._log(f"   {model:<30} | "
                     f"W: {stats.wins:2d} | L: {stats.losses:2d} | "
                     f"Rate: {stats.win_rate:.1%} | "
                     f"Games: {stats.games_played:2d} | "
                     f"Assassin Hits: {stats.assassin_hits:2d} | "
                     f"Assassin Wins: {stats.assassin_wins:2d}")
        
        self._log(f"\n🎯 OPERATIVE PERFORMANCE:")
        operative_items = sorted(self.stats.operative_stats.items(), 
                                key=lambda x: x[1].win_rate, reverse=True)
        
        for model, stats in operative_items:
            self._log(f"   {model:<30} | "
                     f"W: {stats.wins:2d} | L: {stats.losses:2d} | "
                     f"Rate: {stats.win_rate:.1%} | "
                     f"Games: {stats.games_played:2d} | "
                     f"Assassin Hits: {stats.assassin_hits:2d} | "
                     f"Assassin Wins: {stats.assassin_wins:2d}")
        
        self._log(f"\n👥 TEAM COMBINATION PERFORMANCE:")
        combo_items = sorted(self.stats.team_model_combinations.items(), 
                            key=lambda x: x[1].win_rate, reverse=True)
        
        for combo, stats in combo_items:
            self._log(f"   {combo:<60} | "
                     f"W: {stats.wins:2d} | L: {stats.losses:2d} | "
                     f"Rate: {stats.win_rate:.1%} | "
                     f"Games: {stats.games_played:2d}")
    
    def save_results(self, filepath: Path):
        """Save tournament results to a JSON file."""
        results_data = {
            "tournament_config": {
                "num_games": self.num_games,
                "seed": self.seed,
                "randomize_starting_team": self.randomize_starting_team,
                "track_detailed_stats": self.track_detailed_stats
            },
            "overall_stats": {
                "total_games": self.stats.total_games,
                "red_wins": self.stats.red_wins,
                "blue_wins": self.stats.blue_wins,
                "draws": self.stats.draws,
                "red_win_rate": self.stats.red_win_rate,
                "blue_win_rate": self.stats.blue_win_rate,
                "avg_turns_per_game": self.stats.avg_turns_per_game,
                "avg_duration_per_game": self.stats.avg_duration_per_game,
                "assassin_games": self.stats.assassin_games,
                "total_duration": self.stats.total_duration
            },
            "game_results": [
                {
                    "game_number": r.game_number,
                    "winner": r.winner.name if r.winner else None,
                    "starting_team": r.starting_team.name,
                    "turns_played": r.turns_played,
                    "assassin_revealed": r.assassin_revealed,
                    "red_cards_remaining": r.red_cards_remaining,
                    "blue_cards_remaining": r.blue_cards_remaining,
                    "duration_seconds": r.duration_seconds,
                    "red_spymaster_model": r.red_spymaster_model,
                    "red_operative_model": r.red_operative_model,
                    "blue_spymaster_model": r.blue_spymaster_model,
                    "blue_operative_model": r.blue_operative_model
                }
                for r in self.results
            ]
        }
        
        if self.track_detailed_stats:
            results_data["model_stats"] = {
                "spymaster_stats": {
                    model: {
                        "wins": stats.wins,
                        "losses": stats.losses,
                        "games_played": stats.games_played,
                        "win_rate": stats.win_rate,
                        "assassin_hits": stats.assassin_hits,
                        "assassin_wins": stats.assassin_wins
                    }
                    for model, stats in self.stats.spymaster_stats.items()
                },
                "operative_stats": {
                    model: {
                        "wins": stats.wins,
                        "losses": stats.losses,
                        "games_played": stats.games_played,
                        "win_rate": stats.win_rate,
                        "assassin_hits": stats.assassin_hits,
                        "assassin_wins": stats.assassin_wins
                    }
                    for model, stats in self.stats.operative_stats.items()
                },
                "team_combinations": {
                    combo: {
                        "wins": stats.wins,
                        "losses": stats.losses,
                        "games_played": stats.games_played,
                        "win_rate": stats.win_rate
                    }
                    for combo, stats in self.stats.team_model_combinations.items()
                }
            }
        
        with open(filepath, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        self._log(f"\n💾 Results saved to: {filepath}")
    
    def _extract_config_for_logging(self, game_config) -> Dict:
        """Extract configuration data for logging purposes."""
        config_dict = {
            'num_games': self.num_games,
            'seed': self.seed,
            'randomize_starting_team': self.randomize_starting_team,
            'track_detailed_stats': self.track_detailed_stats,
            'agents': {}
        }
        
        # Extract agent configurations
        if hasattr(game_config, 'agents'):
            for team, roles in game_config.agents.items():
                for role_name, agent_config in roles.items():
                    key = f"{team.name.lower()}_{role_name}"
                    config_dict['agents'][key] = {
                        'provider': agent_config.provider,
                        'model': agent_config.model,
                        'temperature': agent_config.temperature,
                        'max_output_tokens': agent_config.max_output_tokens
                    }
        
        return config_dict
    
    def _save_csv_results(self):
        """Save all tournament results to CSV files."""
        try:
            session_folder = self.csv_logger.log_complete_tournament(
                self.stats, 
                self.results, 
                self.config_dict
            )
            self._log(f"\n📊 CSV results saved to: {session_folder}")
            self._log(f"   Files created:")
            for csv_file in sorted(session_folder.glob("*.csv")):
                self._log(f"   - {csv_file.name}")
            self._log(f"   - tournament_summary.txt")
            
        except Exception as e:
            self._log(f"⚠️  Error saving CSV results: {e}")
    
    def _save_llm_conversations(self):
        """Save all LLM conversation logs."""
        try:
            self.llm_logger.save_all_conversations()
            self._log(f"\n💬 LLM conversation logs saved")
            session_folder = self.csv_logger.create_session_folder()
            conversations_folder = session_folder / "llm_conversations"
            if conversations_folder.exists():
                conversation_files = list(conversations_folder.glob("*.txt"))
                json_files = list(conversations_folder.glob("*.json"))
                self._log(f"   Conversation files created:")
                self._log(f"   - {len(conversation_files)} human-readable conversation logs")
                self._log(f"   - {len(json_files)} JSON conversation files")
                self._log(f"   - conversation_statistics.txt")
                self._log(f"   - master_conversation_log.json")
        except Exception as e:
            self._log(f"⚠️  Error saving LLM conversation logs: {e}")
    
    def _log(self, message: str):
        """Log a message if verbose mode is enabled."""
        if self.verbose:
            print(message)


__all__ = ["Tournament"]
