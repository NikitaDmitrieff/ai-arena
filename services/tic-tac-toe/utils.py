"""Utility functions for the tic-tac-toe game."""

def check_winner(board):
    """
    Check if there's a winner on the board.
    
    Args:
        board: 3x3 list representing the game board
        
    Returns:
        'X' if X wins, 'O' if O wins, None otherwise
    """
    # Check rows
    for row in board:
        if row[0] == row[1] == row[2] and row[0] is not None:
            return row[0]
    
    # Check columns
    for col in range(3):
        if board[0][col] == board[1][col] == board[2][col] and board[0][col] is not None:
            return board[0][col]
    
    # Check diagonals
    if board[0][0] == board[1][1] == board[2][2] and board[0][0] is not None:
        return board[0][0]
    
    if board[0][2] == board[1][1] == board[2][0] and board[0][2] is not None:
        return board[0][2]
    
    return None


def is_board_full(board):
    """
    Check if the board is full (no empty spaces).
    
    Args:
        board: 3x3 list representing the game board
        
    Returns:
        True if board is full, False otherwise
    """
    for row in board:
        for cell in row:
            if cell is None:
                return False
    return True


def get_available_moves(board):
    """
    Get list of available moves (empty cells).
    
    Args:
        board: 3x3 list representing the game board
        
    Returns:
        List of tuples (row, col) representing available positions
    """
    moves = []
    for row in range(3):
        for col in range(3):
            if board[row][col] is None:
                moves.append((row, col))
    return moves


def print_board(board):
    """
    Print the board in a readable format.
    
    Args:
        board: 3x3 list representing the game board
    """
    print("\n")
    for i, row in enumerate(board):
        row_str = " | ".join([cell if cell else " " for cell in row])
        print(f" {row_str} ")
        if i < 2:
            print("-" * 11)
    print("\n")

