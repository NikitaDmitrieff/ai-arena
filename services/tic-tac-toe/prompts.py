"""Prompts for LLM players in tic-tac-toe."""

SYSTEM_PROMPT = """You are an expert tic-tac-toe player. Your goal is to win the game by making strategic moves.

Rules:
- The board is a 3x3 grid with positions (0,0) to (2,2)
- Row 0 is the top row, row 2 is the bottom row
- Column 0 is the left column, column 2 is the right column
- You win by getting three of your symbols in a row (horizontal, vertical, or diagonal)
- Block your opponent from getting three in a row
- Take the center if available
- Take corners when possible

You must respond with ONLY a JSON object in this exact format:
{"row": 0, "col": 1, "reasoning": "brief explanation"}

The row and col values must be integers between 0 and 2.
Do not include any other text or explanation outside the JSON object."""


def get_move_prompt(board_state, player_symbol, available_moves):
    """
    Generate the user prompt for move selection.
    
    Args:
        board_state: 3x3 list representing the current board
        player_symbol: 'X' or 'O'
        available_moves: List of (row, col) tuples for available positions
        
    Returns:
        Formatted prompt string
    """
    # Format the board for display
    board_lines = []
    board_lines.append("\nCurrent Board State:")
    board_lines.append("     0   1   2")
    board_lines.append("   +---+---+---+")
    
    for row_idx, row in enumerate(board_state):
        row_display = f" {row_idx} |"
        for cell in row:
            symbol = cell if cell else " "
            row_display += f" {symbol} |"
        board_lines.append(row_display)
        board_lines.append("   +---+---+---+")
    
    board_str = "\n".join(board_lines)
    
    # Format available moves
    moves_str = ", ".join([f"({r},{c})" for r, c in available_moves])
    
    prompt = f"""{board_str}

You are playing as: {player_symbol}
Available moves (row, col): {moves_str}

Analyze the board and choose your best move. Consider:
1. Can you win on this move?
2. Must you block opponent from winning?
3. Strategic positioning (center, corners, sides)

Respond with JSON only: {{"row": <int>, "col": <int>, "reasoning": "<brief explanation>"}}"""
    
    return prompt


def get_game_analysis_prompt(board_state, winner, total_moves):
    """
    Generate prompt for post-game analysis.
    
    Args:
        board_state: Final board state
        winner: 'X', 'O', or None (draw)
        total_moves: Number of moves made
        
    Returns:
        Formatted prompt string
    """
    outcome = f"{winner} won" if winner else "Draw"
    
    board_lines = []
    for row in board_state:
        row_display = " | ".join([cell if cell else " " for cell in row])
        board_lines.append(row_display)
    
    board_str = "\n".join(board_lines)
    
    prompt = f"""Analyze this completed tic-tac-toe game:

Final Board:
{board_str}

Outcome: {outcome}
Total Moves: {total_moves}

Provide a brief analysis of the game strategy and key moments."""
    
    return prompt


# Fallback prompts for different scenarios
ERROR_RECOVERY_PROMPT = """Your previous response was not in the correct format or contained an invalid move.

Remember:
1. Respond with ONLY a JSON object
2. Use this exact format: {{"row": <int>, "col": <int>, "reasoning": "<text>"}}
3. Row and col must be integers between 0 and 2
4. The position must be empty on the board

Try again with a valid move."""

