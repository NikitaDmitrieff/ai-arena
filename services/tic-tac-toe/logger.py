"""CSV logging for tic-tac-toe games."""

import csv
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any


class GameLogger:
    """Logs game events to CSV files."""
    
    def __init__(self, log_dir: str = "logs"):
        """
        Initialize the game logger.
        
        Args:
            log_dir: Directory to store log files
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Create separate log files
        self.moves_file = self.log_dir / f"moves_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        self.games_file = self.log_dir / f"games_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Initialize CSV files with headers
        self._init_moves_log()
        self._init_games_log()
    
    def _init_moves_log(self):
        """Initialize the moves log file with headers."""
        with open(self.moves_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'timestamp',
                'game_id',
                'move_number',
                'player',
                'player_type',  # 'random' or 'llm'
                'board_state',
                'available_moves',
                'prompt_sent',
                'llm_response',
                'llm_reasoning',
                'chosen_move',
                'move_valid',
                'error_message',
                'response_time_ms'
            ])
    
    def _init_games_log(self):
        """Initialize the games log file with headers."""
        with open(self.games_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'timestamp',
                'game_id',
                'player_x_type',
                'player_x_model',
                'player_o_type',
                'player_o_model',
                'total_moves',
                'winner',
                'is_draw',
                'duration_seconds',
                'final_board_state'
            ])
    
    def log_move(
        self,
        game_id: str,
        move_number: int,
        player: str,
        player_type: str,
        board_state: list,
        available_moves: list,
        prompt_sent: Optional[str] = None,
        llm_response: Optional[str] = None,
        llm_reasoning: Optional[str] = None,
        chosen_move: Optional[tuple] = None,
        move_valid: bool = True,
        error_message: Optional[str] = None,
        response_time_ms: Optional[float] = None
    ):
        """
        Log a single move.
        
        Args:
            game_id: Unique game identifier
            move_number: Move sequence number
            player: 'X' or 'O'
            player_type: 'random' or 'llm'
            board_state: Current board as list
            available_moves: List of available positions
            prompt_sent: Prompt sent to LLM (if applicable)
            llm_response: Raw response from LLM
            llm_reasoning: Reasoning extracted from response
            chosen_move: (row, col) tuple
            move_valid: Whether the move was valid
            error_message: Error message if move failed
            response_time_ms: Response time in milliseconds
        """
        with open(self.moves_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Format board state as string
            board_str = str(board_state).replace('\n', ' ')
            moves_str = str(available_moves)
            move_str = str(chosen_move) if chosen_move else ''
            
            # Truncate long prompts/responses for readability
            prompt_str = (prompt_sent[:500] + '...') if prompt_sent and len(prompt_sent) > 500 else prompt_sent
            response_str = (llm_response[:500] + '...') if llm_response and len(llm_response) > 500 else llm_response
            
            writer.writerow([
                datetime.now().isoformat(),
                game_id,
                move_number,
                player,
                player_type,
                board_str,
                moves_str,
                prompt_str or '',
                response_str or '',
                llm_reasoning or '',
                move_str,
                move_valid,
                error_message or '',
                response_time_ms or ''
            ])
    
    def log_game(
        self,
        game_id: str,
        player_x_type: str,
        player_x_model: Optional[str],
        player_o_type: str,
        player_o_model: Optional[str],
        total_moves: int,
        winner: Optional[str],
        is_draw: bool,
        duration_seconds: float,
        final_board_state: list
    ):
        """
        Log game summary.
        
        Args:
            game_id: Unique game identifier
            player_x_type: 'random' or 'llm'
            player_x_model: Model name if LLM
            player_o_type: 'random' or 'llm'
            player_o_model: Model name if LLM
            total_moves: Total number of moves
            winner: 'X', 'O', or None
            is_draw: Whether game was a draw
            duration_seconds: Game duration
            final_board_state: Final board state
        """
        with open(self.games_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            board_str = str(final_board_state).replace('\n', ' ')
            
            writer.writerow([
                datetime.now().isoformat(),
                game_id,
                player_x_type,
                player_x_model or '',
                player_o_type,
                player_o_model or '',
                total_moves,
                winner or '',
                is_draw,
                f"{duration_seconds:.2f}",
                board_str
            ])
    
    def get_log_paths(self) -> Dict[str, Path]:
        """
        Get paths to log files.
        
        Returns:
            Dictionary with 'moves' and 'games' paths
        """
        return {
            'moves': self.moves_file,
            'games': self.games_file
        }


# Global logger instance
_global_logger: Optional[GameLogger] = None


def get_logger() -> GameLogger:
    """Get or create the global logger instance."""
    global _global_logger
    if _global_logger is None:
        _global_logger = GameLogger()
    return _global_logger


def reset_logger():
    """Reset the global logger (useful for testing)."""
    global _global_logger
    _global_logger = None

