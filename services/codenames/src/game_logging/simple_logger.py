from __future__ import annotations

import io
from pathlib import Path
from typing import Optional, TextIO, TYPE_CHECKING

if TYPE_CHECKING:
    from codenames.board import Board
    from codenames.models import Team, Position, GuessResult
    from codenames.utils import BOARD_SIZE, all_positions, position_to_label


class SimpleGameLogger:
    """Handles simple, clean game logging with optional file output."""
    
    def __init__(self, output_file: Optional[Path] = None):
        self.output_file = output_file
        self.log_buffer = io.StringIO()
        self._game_started = False
        
    def _write(self, message: str) -> None:
        """Write message to console and buffer."""
        print(message)
        self.log_buffer.write(message + "\n")
    
    def log_game_start(self, starting_team: Team) -> None:
        """Log the game start."""
        self._write(f"🎯 Codenames Game Starting - {starting_team.name} team goes first\n")
        self._game_started = True
    
    def log_board(self, board, spymaster_view: bool = False) -> None:
        """Log the game board in a clean format."""
        if not self._game_started:
            return
            
        # Import here to avoid circular imports
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from codenames.models import Position
        from codenames.utils import BOARD_SIZE
            
        self._write("📋 Game Board:")
        self._write("   A    B    C    D    E")
        
        for row in range(BOARD_SIZE):
            row_parts = [f"{row + 1}"]
            for col in range(BOARD_SIZE):
                position = Position(row=row, col=col)
                card = board.get_card(position)
                
                if spymaster_view or card.revealed:
                    # Show card type with color coding
                    if card.card_type.name == "RED":
                        symbol = "🔴" if card.revealed else "🟥"
                    elif card.card_type.name == "BLUE":
                        symbol = "🔵" if card.revealed else "🟦"
                    elif card.card_type.name == "NEUTRAL":
                        symbol = "⚪" if card.revealed else "⬜"
                    elif card.card_type.name == "ASSASSIN":
                        symbol = "💀" if card.revealed else "⬛"
                    else:
                        symbol = "❓"
                else:
                    symbol = "⬜"
                
                # Format word to fit in column
                word = card.word.upper()[:6].ljust(6)
                row_parts.append(f"{word}")
            
            self._write(" ".join(row_parts))
        
        if spymaster_view:
            self._write("🔴 Red cards  🔵 Blue cards  ⚪ Neutral  💀 Assassin")
        else:
            self._write("⬜ Hidden cards  🔴🔵⚪💀 Revealed cards")
        self._write("")
    
    def log_turn_start(self, turn_number: int, team) -> None:
        """Log the start of a turn."""
        self._write(f"Turn {turn_number} - {team.name} team:")
    
    def log_clue(self, clue_word: str, clue_number: int) -> None:
        """Log a spymaster clue."""
        self._write(f"  🔍 Clue: {clue_word} {clue_number}")
    
    def log_guess_result(self, team, result) -> None:
        """Log a guess result with appropriate emoji and formatting."""
        card = result.card
        owner = card.card_type.team
        owner_label = owner.name if owner else card.card_type.name
        
        if result.assassin_hit:
            self._write(f"  💀 {card.word.upper()} → ASSASSIN! Game over!")
        elif result.team_won is not None:
            self._write(f"  🎯 {card.word.upper()} → {owner_label} (WINNING CARD!)")
        else:
            # Use emojis for different card types
            if owner_label == team.name:
                self._write(f"  ✅ {card.word.upper()} → {owner_label}")
            elif owner_label == "NEUTRAL":
                self._write(f"  ⚪ {card.word.upper()} → NEUTRAL")
            else:
                self._write(f"  ❌ {card.word.upper()} → {owner_label}")
        
        # Note: guesses_left is passed as a parameter since we can't access game state directly
    
    def log_guess_result_with_remaining(self, team, result, guesses_left: int) -> None:
        """Log a guess result with remaining guesses information."""
        self.log_guess_result(team, result)
        
        if guesses_left > 0 and not result.ended_turn and not result.assassin_hit and result.team_won is None:
            self._write(f"     ({guesses_left} guess{'es' if guesses_left != 1 else ''} remaining)")
    
    def log_turn_end(self) -> None:
        """Log when a team ends their turn."""
        self._write(f"  ⏭️  Team ended their turn")
    
    def log_game_end(self, winner, assassin_revealed: bool, total_turns: int) -> None:
        """Log the game end with results."""
        self._write("")  # Empty line for spacing
        
        if winner is not None:
            self._write(f"🏆 {winner.name} team wins!")
        else:
            self._write("🤝 Game ended in a tie!")
            
        if assassin_revealed:
            self._write("💀 Assassin was revealed!")
            
        self._write(f"📊 Game completed in {total_turns} turns")
    
    def save_to_file(self) -> None:
        """Save the logged content to file if output_file is set."""
        if self.output_file:
            self.output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write(self.log_buffer.getvalue())
    
    def get_log_content(self) -> str:
        """Get the current log content as a string."""
        return self.log_buffer.getvalue()
