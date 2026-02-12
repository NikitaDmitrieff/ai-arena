"""Game class for the tic-tac-toe game."""

import time
import uuid
from typing import Optional

from board import Board
from player import Player
from logger import get_logger


class Game:
    """Represents a tic-tac-toe game."""
    
    def __init__(
        self,
        game_id: Optional[str] = None,
        player_x: Optional[Player] = None,
        player_o: Optional[Player] = None,
        enable_logging: bool = True
    ):
        """
        Initialize a new game.
        
        Args:
            game_id: Unique game identifier (generated if not provided)
            player_x: Player X instance (created if not provided)
            player_o: Player O instance (created if not provided)
            enable_logging: Whether to log game events
        """
        self.game_id = game_id or str(uuid.uuid4())
        self.board = Board()
        self.player_x = player_x or Player('X', 'Player X')
        self.player_o = player_o or Player('O', 'Player O')
        self.current_player = self.player_x
        self.winner = None
        self.is_draw = False
        self.game_over = False
        self.move_history = []
        self.enable_logging = enable_logging
        self.start_time = time.time()
        self.logger = get_logger() if enable_logging else None
    
    def switch_player(self):
        """Switch to the other player."""
        self.current_player = self.player_o if self.current_player == self.player_x else self.player_x
    
    def make_move(self, row=None, col=None):
        """
        Make a move. If row and col are not provided, current player chooses.
        
        Args:
            row: Row index (0-2) or None for player to choose
            col: Column index (0-2) or None for player to choose
            
        Returns:
            Dictionary with move result
        """
        if self.game_over:
            return {
                'success': False,
                'message': 'Game is already over',
                'board': self.board.get_state(),
                'game_over': True,
                'winner': self.winner,
                'is_draw': self.is_draw
            }
        
        available_moves = self.board.get_available_moves()
        
        if not available_moves:
            self.is_draw = True
            self.game_over = True
            self._log_game_summary()
            return {
                'success': False,
                'message': 'No available moves',
                'board': self.board.get_state(),
                'game_over': True,
                'winner': None,
                'is_draw': True
            }
        
        move_metadata = {}
        
        # If no specific move provided, let player choose
        if row is None or col is None:
            move_result = self.current_player.choose_move(
                available_moves,
                board_state=self.board.get_state()
            )
            
            # Handle new return format (move, metadata)
            if isinstance(move_result, tuple) and len(move_result) == 2:
                move, move_metadata = move_result
                if move:
                    row, col = move
            else:
                # Backward compatibility
                row, col = move_result
        
        # Try to make the move
        move_valid = self.board.make_move(row, col, self.current_player.symbol)
        
        # Log the move
        if self.enable_logging and self.logger:
            self.logger.log_move(
                game_id=self.game_id,
                move_number=len(self.move_history) + 1,
                player=self.current_player.symbol,
                player_type=move_metadata.get('player_type', 'random'),
                board_state=self.board.get_state(),
                available_moves=available_moves,
                prompt_sent=move_metadata.get('prompt'),
                llm_response=move_metadata.get('response'),
                llm_reasoning=move_metadata.get('reasoning'),
                chosen_move=(row, col) if row is not None else None,
                move_valid=move_valid,
                error_message=move_metadata.get('error'),
                response_time_ms=move_metadata.get('response_time_ms')
            )
        
        if not move_valid:
            return {
                'success': False,
                'message': f'Invalid move at ({row}, {col})',
                'board': self.board.get_state(),
                'game_over': False,
                'current_player': self.current_player.symbol,
                'metadata': move_metadata
            }
        
        # Record the move
        self.move_history.append({
            'player': self.current_player.symbol,
            'row': row,
            'col': col,
            'reasoning': move_metadata.get('reasoning')
        })
        
        # Check for winner
        winner = self.board.get_winner()
        if winner:
            self.winner = winner
            self.game_over = True
            self._log_game_summary()
            return {
                'success': True,
                'message': f'{self.current_player.name} wins!',
                'board': self.board.get_state(),
                'game_over': True,
                'winner': winner,
                'is_draw': False,
                'move': {'row': row, 'col': col, 'player': self.current_player.symbol},
                'metadata': move_metadata
            }
        
        # Check for draw
        if self.board.is_full():
            self.is_draw = True
            self.game_over = True
            self._log_game_summary()
            return {
                'success': True,
                'message': "It's a draw!",
                'board': self.board.get_state(),
                'game_over': True,
                'winner': None,
                'is_draw': True,
                'move': {'row': row, 'col': col, 'player': self.current_player.symbol},
                'metadata': move_metadata
            }
        
        # Switch to next player
        self.switch_player()
        
        return {
            'success': True,
            'message': 'Move successful',
            'board': self.board.get_state(),
            'game_over': False,
            'current_player': self.current_player.symbol,
            'move': {'row': row, 'col': col, 'player': self.player_x.symbol if self.current_player == self.player_o else self.player_o.symbol},
            'metadata': move_metadata
        }
    
    def play_auto(self):
        """
        Play the game automatically with both players making random moves.
        
        Returns:
            Dictionary with game result
        """
        moves = []
        while not self.game_over:
            result = self.make_move()
            moves.append(result)
        
        return {
            'winner': self.winner,
            'is_draw': self.is_draw,
            'board': self.board.get_state(),
            'moves': moves,
            'total_moves': len(self.move_history)
        }
    
    def get_state(self):
        """
        Get current game state.
        
        Returns:
            Dictionary with game state
        """
        return {
            'board': self.board.get_state(),
            'current_player': self.current_player.symbol if not self.game_over else None,
            'winner': self.winner,
            'is_draw': self.is_draw,
            'game_over': self.game_over,
            'move_history': self.move_history,
            'available_moves': self.board.get_available_moves() if not self.game_over else []
        }
    
    def reset(self):
        """Reset the game to initial state."""
        self.board.reset()
        self.current_player = self.player_x
        self.winner = None
        self.is_draw = False
        self.game_over = False
        self.move_history = []
        self.start_time = time.time()
    
    def _log_game_summary(self):
        """Log game summary to CSV."""
        if not self.enable_logging or not self.logger:
            return
        
        duration = time.time() - self.start_time
        
        self.logger.log_game(
            game_id=self.game_id,
            player_x_type=self.player_x.get_player_type(),
            player_x_model=self.player_x.get_model_name(),
            player_o_type=self.player_o.get_player_type(),
            player_o_model=self.player_o.get_model_name(),
            total_moves=len(self.move_history),
            winner=self.winner,
            is_draw=self.is_draw,
            duration_seconds=duration,
            final_board_state=self.board.get_state()
        )
