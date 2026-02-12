from __future__ import annotations

import csv
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from codenames.tournament_models import GameResult, ModelStats, TournamentStats


class CSVLogger:
    """Handles CSV logging for tournament results."""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.session_folder: Optional[Path] = None
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def create_session_folder(self) -> Path:
        """Create a timestamped folder for this tournament session."""
        if self.session_folder is None:
            folder_name = f"tournament_{self.timestamp}"
            self.session_folder = self.base_path / folder_name
            self.session_folder.mkdir(parents=True, exist_ok=True)
        return self.session_folder
    
    def log_tournament_config(self, config: dict) -> None:
        """Log tournament configuration to CSV."""
        session_folder = self.create_session_folder()
        config_file = session_folder / "tournament_config.csv"
        
        with open(config_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Parameter', 'Value'])
            
            # Tournament settings
            writer.writerow(['Tournament Timestamp', self.timestamp])
            writer.writerow(['Number of Games', config.get('num_games', 'N/A')])
            writer.writerow(['Randomize Starting Team', config.get('randomize_starting_team', 'N/A')])
            writer.writerow(['Seed', config.get('seed', 'N/A')])
            
            # Agent configurations - simplified
            agents = config.get('agents', {})
            for team_color in ['red', 'blue']:
                for role in ['spymaster', 'operatives']:
                    key = f"{team_color}_{role}"
                    if key in agents:
                        agent_config = agents[key]
                        writer.writerow([f'{team_color.title()} {role.title()} Model', agent_config.get('model', 'N/A')])
    
    def log_game_results(self, results: List[GameResult]) -> None:
        """Log individual game results to CSV."""
        session_folder = self.create_session_folder()
        games_file = session_folder / "game_results.csv"
        
        with open(games_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Header - simplified
            writer.writerow([
                'Game_Number',
                'Winner',
                'Starting_Team',
                'Turns_Played',
                'Assassin_Revealed',
                'Red_Cards_Remaining',
                'Blue_Cards_Remaining',
                'Red_Spymaster_Model',
                'Red_Operative_Model',
                'Blue_Spymaster_Model',
                'Blue_Operative_Model',
                'Game_End_Reason'
            ])
            
            # Data rows
            for result in results:
                end_reason = 'Assassin' if result.assassin_revealed else 'Cards_Cleared'
                writer.writerow([
                    result.game_number,
                    result.winner.name if result.winner else 'Draw',
                    result.starting_team.name,
                    result.turns_played,
                    result.assassin_revealed,
                    result.red_cards_remaining,
                    result.blue_cards_remaining,
                    result.red_spymaster_model,
                    result.red_operative_model,
                    result.blue_spymaster_model,
                    result.blue_operative_model,
                    end_reason
                ])
    
    def log_overall_stats(self, stats: TournamentStats) -> None:
        """Log overall tournament statistics to CSV."""
        session_folder = self.create_session_folder()
        stats_file = session_folder / "overall_stats.csv"
        
        with open(stats_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Metric', 'Value'])
            
            writer.writerow(['Total Games', stats.total_games])
            writer.writerow(['Red Wins', stats.red_wins])
            writer.writerow(['Blue Wins', stats.blue_wins])
            writer.writerow(['Draws', stats.draws])
            writer.writerow(['Red Win Rate', f"{stats.red_win_rate:.2%}"])
            writer.writerow(['Blue Win Rate', f"{stats.blue_win_rate:.2%}"])
            writer.writerow(['Average Turns Per Game', f"{stats.avg_turns_per_game:.1f}"])
            writer.writerow(['Games with Assassin', stats.assassin_games])
            writer.writerow(['Assassin Game Rate', f"{stats.assassin_games/stats.total_games:.2%}" if stats.total_games > 0 else "0.0%"])
    
    def log_model_performance(self, stats: TournamentStats) -> None:
        """Log detailed model performance statistics to CSV."""
        session_folder = self.create_session_folder()
        
        # Spymaster performance - simplified
        spymaster_file = session_folder / "spymaster_performance.csv"
        with open(spymaster_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Model',
                'Wins',
                'Losses',
                'Games_Played',
                'Win_Rate',
                'Assassin_Hits'
            ])
            
            for model, model_stats in stats.spymaster_stats.items():
                writer.writerow([
                    model,
                    model_stats.wins,
                    model_stats.losses,
                    model_stats.games_played,
                    f"{model_stats.win_rate:.2%}",
                    model_stats.assassin_hits
                ])
        
        # Operative performance - simplified
        operative_file = session_folder / "operative_performance.csv"
        with open(operative_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Model',
                'Wins',
                'Losses',
                'Games_Played',
                'Win_Rate',
                'Assassin_Hits'
            ])
            
            for model, model_stats in stats.operative_stats.items():
                writer.writerow([
                    model,
                    model_stats.wins,
                    model_stats.losses,
                    model_stats.games_played,
                    f"{model_stats.win_rate:.2%}",
                    model_stats.assassin_hits
                ])
    
    def log_team_combinations(self, stats: TournamentStats) -> None:
        """Log team combination performance to CSV."""
        session_folder = self.create_session_folder()
        teams_file = session_folder / "team_combinations.csv"
        
        with open(teams_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Team_Color',
                'Spymaster_Model',
                'Operative_Model',
                'Wins',
                'Losses',
                'Games_Played',
                'Win_Rate'
            ])
            
            for combo, combo_stats in stats.team_model_combinations.items():
                # Parse combo format: "R:provider/model+provider/model" or "B:provider/model+provider/model"
                team_color = combo[0]  # R or B
                models_part = combo[2:]  # Everything after "R:" or "B:"
                spymaster_model, operative_model = models_part.split('+', 1)
                
                writer.writerow([
                    'Red' if team_color == 'R' else 'Blue',
                    spymaster_model,
                    operative_model,
                    combo_stats.wins,
                    combo_stats.losses,
                    combo_stats.games_played,
                    f"{combo_stats.win_rate:.2%}"
                ])
    
    def log_turn_by_turn_data(self, results: List[GameResult]) -> None:
        """Log simplified turn analysis data to CSV."""
        session_folder = self.create_session_folder()
        turns_file = session_folder / "turn_analysis.csv"
        
        with open(turns_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Game_Number',
                'Winner',
                'Starting_Team',
                'Turns_Played',
                'Assassin_Revealed',
                'Cards_Cleared_Red',
                'Cards_Cleared_Blue'
            ])
            
            for result in results:
                red_cleared = 9 - result.red_cards_remaining  # Assuming 9 red cards initially
                blue_cleared = 8 - result.blue_cards_remaining  # Assuming 8 blue cards initially
                
                writer.writerow([
                    result.game_number,
                    result.winner.name if result.winner else 'Draw',
                    result.starting_team.name,
                    result.turns_played,
                    result.assassin_revealed,
                    red_cleared,
                    blue_cleared
                ])
    
    def create_summary_report(self, stats: TournamentStats, config: dict) -> None:
        """Create a human-readable summary report."""
        session_folder = self.create_session_folder()
        summary_file = session_folder / "tournament_summary.txt"
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("CODENAMES AI TOURNAMENT SUMMARY REPORT\n")
            f.write("=" * 80 + "\n")
            f.write(f"Tournament Date: {self.timestamp}\n")
            f.write(f"Total Games: {stats.total_games}\n\n")
            
            f.write("OVERALL RESULTS:\n")
            f.write("-" * 40 + "\n")
            f.write(f"Red Team Wins: {stats.red_wins} ({stats.red_win_rate:.1%})\n")
            f.write(f"Blue Team Wins: {stats.blue_wins} ({stats.blue_win_rate:.1%})\n")
            f.write(f"Draws: {stats.draws}\n")
            f.write(f"Games ending with Assassin: {stats.assassin_games} ({stats.assassin_games/stats.total_games:.1%})\n")
            f.write(f"Average game length: {stats.avg_turns_per_game:.1f} turns\n\n")
            
            f.write("TOP PERFORMING MODELS:\n")
            f.write("-" * 40 + "\n")
            
            # Best spymaster
            if stats.spymaster_stats:
                best_spy = max(stats.spymaster_stats.items(), key=lambda x: x[1].win_rate)
                f.write(f"Best Spymaster: {best_spy[0]} ({best_spy[1].win_rate:.1%} win rate)\n")
            
            # Best operative
            if stats.operative_stats:
                best_op = max(stats.operative_stats.items(), key=lambda x: x[1].win_rate)
                f.write(f"Best Operative: {best_op[0]} ({best_op[1].win_rate:.1%} win rate)\n")
            
            # Best team combination
            if stats.team_model_combinations:
                best_team = max(stats.team_model_combinations.items(), key=lambda x: x[1].win_rate)
                f.write(f"Best Team Combination: {best_team[0]} ({best_team[1].win_rate:.1%} win rate)\n")
    
    def log_complete_tournament(self, stats: TournamentStats, results: List[GameResult], config: dict) -> Path:
        """Log all tournament data to CSV files and return the session folder path."""
        session_folder = self.create_session_folder()
        
        # Log all data
        self.log_tournament_config(config)
        self.log_game_results(results)
        self.log_overall_stats(stats)
        
        if stats.track_detailed_stats:
            self.log_model_performance(stats)
            self.log_team_combinations(stats)
        
        self.log_turn_by_turn_data(results)
        self.create_summary_report(stats, config)
        
        return session_folder


__all__ = ["CSVLogger"]
