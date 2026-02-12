"""Board class for the tic-tac-toe game."""

from utils import check_winner, is_board_full, get_available_moves, print_board


class Board:
    """Represents a tic-tac-toe board."""
    
    def __init__(self):
        """Initialize an empty 3x3 board."""
        self.board = [[None, None, None] for _ in range(3)]
    
    def make_move(self, row, col, symbol):
        """
        Make a move on the board.
        
        Args:
            row: Row index (0-2)
            col: Column index (0-2)
            symbol: 'X' or 'O'
            
        Returns:
            True if move was successful, False otherwise
        """
        if row < 0 or row > 2 or col < 0 or col > 2:
            return False
        
        if self.board[row][col] is not None:
            return False
        
        self.board[row][col] = symbol
        return True
    
    def get_winner(self):
        """
        Check if there's a winner.
        
        Returns:
            'X', 'O', or None
        """
        return check_winner(self.board)
    
    def is_full(self):
        """
        Check if board is full.
        
        Returns:
            True if full, False otherwise
        """
        return is_board_full(self.board)
    
    def get_available_moves(self):
        """
        Get available moves.
        
        Returns:
            List of (row, col) tuples
        """
        return get_available_moves(self.board)
    
    def display(self):
        """Print the board."""
        print_board(self.board)
    
    def get_state(self):
        """
        Get current board state.
        
        Returns:
            3x3 list representing the board
        """
        return [row[:] for row in self.board]
    
    def reset(self):
        """Reset the board to empty state."""
        self.board = [[None, None, None] for _ in range(3)]

