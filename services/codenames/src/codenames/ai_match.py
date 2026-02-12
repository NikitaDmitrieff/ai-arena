from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from typing import Dict, List, Optional
from pathlib import Path

from nikitas_agents import BaseAgent

from game_logging.llm_logger import LLMMessageLogger
from prompts import (
    build_operative_user_prompt,
    build_spymaster_user_prompt,
    operative_system_prompt,
    spymaster_system_prompt,
)

from .game import Game, GameError
from .models import CardType, Clue, GuessResult, Phase, Position, Team
from .utils import BOARD_SIZE, all_positions, position_to_label

JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


@dataclass
class Persona:
    agent: BaseAgent
    system_prompt: str
    temperature: float
    max_output_tokens: int = 320
    llm_logger: Optional[LLMMessageLogger] = None
    team: Optional[str] = None
    role: Optional[str] = None

    def invoke(self, user_prompt: str, attempt_number: int = 1, feedback: Optional[str] = None) -> str:
        start_time = time.time()
        
        response = self.agent.invoke(
            user_prompt=user_prompt,
            system_prompt=self.system_prompt,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
        )
        
        response_time = time.time() - start_time
        
        # Log the interaction if logger is available
        if self.llm_logger and self.team and self.role:
            # Try to parse JSON from response for logging
            parsed_json = None
            parse_error = None
            try:
                # Use the same parsing logic as _parse_json method
                parsed_json = self._try_parse_json(response)
            except Exception as e:
                parse_error = str(e)
            
            # Get model info
            provider = getattr(self.agent, 'provider', 'unknown')
            model = getattr(self.agent, 'model', 'unknown')
            model_info = f"{provider}/{model}"
            
            self.llm_logger.log_llm_interaction(
                team=self.team,
                role=self.role,
                agent_name=getattr(self.agent, 'name', f"{self.team} {self.role}"),
                model_info=model_info,
                system_prompt=self.system_prompt,
                user_prompt=user_prompt,
                response=response,
                response_time=response_time,
                temperature=self.temperature,
                max_output_tokens=self.max_output_tokens,
                attempt_number=attempt_number,
                feedback=feedback,
                parsed_json=parsed_json,
                parse_error=parse_error
            )
        
        return response
    
    def _try_parse_json(self, text: str) -> Optional[Dict]:
        """Try to parse JSON from response text using same logic as AIMatch._parse_json."""
        text = text.strip()
        if not text:
            return None
        
        # Strip code fences if present
        if text.startswith("```"):
            text = self._strip_code_fence(text)
        
        # Try parsing the entire text first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON object in the text
        import re
        JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)
        match = JSON_OBJECT_PATTERN.search(text)
        if match:
            candidate = match.group(0)
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass
        
        return None
    
    @staticmethod
    def _strip_code_fence(block: str) -> str:
        lines = block.strip().splitlines()
        if len(lines) >= 2 and lines[0].startswith("```"):
            lines = [line for line in lines[1:] if not line.startswith("```")]
        return "\n".join(lines).strip()


@dataclass
class TeamAgents:
    spymaster: Persona
    operative: Persona


class AIMatch:
    def __init__(self, game: Game, *, max_attempts: int = 3, verbose: bool = True, simple_logging: bool = False, simple_log_file: Optional[Path] = None, llm_logger: Optional[LLMMessageLogger] = None):
        self.game = game
        self.max_attempts = max_attempts
        self.history: List[str] = []
        self.turn_counter = 1
        self.verbose = verbose
        self.simple_logging = simple_logging
        self.llm_logger = llm_logger
        self._event_callback = None  # Optional callback for emitting events
        
        # Initialize simple logger if needed
        self.simple_logger = None
        if self.simple_logging:
            # Import here to avoid circular imports
            import sys
            from pathlib import Path
            sys.path.insert(0, str(Path(__file__).parent.parent))
            from game_logging.simple_logger import SimpleGameLogger
            self.simple_logger = SimpleGameLogger(simple_log_file)
        
        self.team_agents: Dict[Team, TeamAgents] = {
            Team.RED: self._build_team_agents(Team.RED),
            Team.BLUE: self._build_team_agents(Team.BLUE),
        }

    def _log(self, message: str) -> None:
        if self.verbose:
            print(message)
    
    def _log_simple(self, message: str) -> None:
        """Simple logging that shows only essential game information"""
        if self.simple_logging or not self.verbose:
            print(message)
    
    def _log_debug(self, message: str) -> None:
        """Debug logging that shows only when verbose is True and simple_logging is False"""
        if self.verbose and not self.simple_logging:
            print(message)
    
    def _emit_event(self, event_type: str, data: Dict) -> None:
        """Emit an event if callback is set."""
        if self._event_callback:
            try:
                self._event_callback(event_type, data)
            except Exception:
                pass  # Don't let event emission break the game

    def _build_team_agents(self, team: Team) -> TeamAgents:
        team_name = team.name.title()
        spymaster_agent = BaseAgent(
            name=f"{team_name} Spymaster",
            description=f"Provides legal Codenames clues for the {team_name} team",
        )
        operative_agent = BaseAgent(
            name=f"{team_name} Operatives",
            description=f"Selects guesses for the {team_name} team in Codenames",
        )
        return TeamAgents(
            spymaster=Persona(
                agent=spymaster_agent,
                system_prompt=spymaster_system_prompt(team.name),
                temperature=0.6,
                llm_logger=self.llm_logger,
                team=team.name,
                role="spymaster"
            ),
            operative=Persona(
                agent=operative_agent,
                system_prompt=operative_system_prompt(team.name),
                temperature=0.5,
                llm_logger=self.llm_logger,
                team=team.name,
                role="operative"
            ),
        )

    def play(self) -> Optional[Team]:
        # Simple logging: use simple logger
        if self.simple_logging and self.simple_logger:
            self.simple_logger.log_game_start(self.game.current_team)
            self.simple_logger.log_board(self.game.board, spymaster_view=False)
        else:
            self._log(f"AI Codenames match starting! Starting team: {self.game.current_team.name}")
        
        # Start turn logging
        if self.llm_logger:
            self.llm_logger.start_turn(self.turn_counter)
        
        max_turns = 50  # Safety limit to prevent infinite games
        stalled_turn_count = 0  # Track turns without progress
        last_remaining = dict(self.game.remaining)
            
        while self.game.phase is not Phase.FINISHED and self.turn_counter <= max_turns:
            team = self.game.current_team
            
            # Emit turn started event
            self._emit_event("turn_started", {
                "turn_number": self.turn_counter,
                "team": team.name,
                "red_remaining": self.game.remaining[Team.RED],
                "blue_remaining": self.game.remaining[Team.BLUE]
            })
            
            # Simple logging: use simple logger
            if self.simple_logging and self.simple_logger:
                self.simple_logger.log_turn_start(self.turn_counter, team)
            else:
                self._log(f"\n=== Turn {self.turn_counter} — {team.name} team ===")
                
            self._log_debug(f"[DEBUG] Main loop - game phase: {self.game.phase}, current team: {team.name}")
            
            # Check if we're making progress (cards being revealed)
            current_remaining = dict(self.game.remaining)
            if current_remaining == last_remaining:
                stalled_turn_count += 1
                if stalled_turn_count >= 10:  # No progress for 10 turns
                    self._log(f"[WARNING] Game appears stalled (no progress for {stalled_turn_count} turns). Ending game.")
                    # Determine winner based on remaining cards
                    if current_remaining[Team.RED] < current_remaining[Team.BLUE]:
                        self.game.winner = Team.RED
                    elif current_remaining[Team.BLUE] < current_remaining[Team.RED]:
                        self.game.winner = Team.BLUE
                    else:
                        self.game.winner = None  # Tie
                    self.game.phase = Phase.FINISHED
                    break
            else:
                stalled_turn_count = 0  # Reset stall counter
                last_remaining = current_remaining
            
            if not self._handle_clue_phase(team):
                self._log(f"{team.name} team failed to provide a valid clue. Game aborted.")
                return None
                
            self._log_debug(f"[DEBUG] After clue phase - game phase: {self.game.phase}")
            
            if self.game.phase is Phase.AWAIT_GUESS:
                self._log_debug(f"[DEBUG] Entering guess handling for {team.name}")
                if not self._handle_guess_phase(team):
                    self._log(f"{team.name} operatives failed to act. Game aborted.")
                    return None
                self._log_debug(f"[DEBUG] After guess phase - game phase: {self.game.phase}, current team: {self.game.current_team.name}")
                
            if self.game.phase is Phase.FINISHED:
                self._log_debug(f"[DEBUG] Game finished, breaking main loop")
                break
                
            self._log_debug(f"[DEBUG] End of turn {self.turn_counter} - advancing to next turn")
            self.turn_counter += 1
            
            # Update turn logging
            if self.llm_logger:
                self.llm_logger.start_turn(self.turn_counter)
                
        if self.turn_counter > max_turns:
            self._log(f"[WARNING] Game exceeded maximum turns ({max_turns}). Ending game.")
            # Determine winner based on remaining cards
            if self.game.remaining[Team.RED] < self.game.remaining[Team.BLUE]:
                self.game.winner = Team.RED
            elif self.game.remaining[Team.BLUE] < self.game.remaining[Team.RED]:
                self.game.winner = Team.BLUE
            else:
                self.game.winner = None  # Tie
            self.game.phase = Phase.FINISHED
        
        # Final result logging
        if self.simple_logging and self.simple_logger:
            self.simple_logger.log_game_end(self.game.winner, self.game.assassin_revealed, self.turn_counter - 1)
            self.simple_logger.save_to_file()
        else:
            if self.game.winner is not None:
                self._log(f"\nWinner: {self.game.winner.name} team!")
            elif self.game.phase is Phase.FINISHED:
                self._log("\nGame ended in a tie!")
            if self.game.assassin_revealed:
                self._log("Assassin was revealed during play.")
        
        # Emit game ended event
        self._emit_event("game_ended", {
            "winner": self.game.winner.name if self.game.winner else None,
            "assassin_revealed": self.game.assassin_revealed,
            "total_turns": self.turn_counter,
            "red_remaining": self.game.remaining[Team.RED],
            "blue_remaining": self.game.remaining[Team.BLUE]
        })
        
        return self.game.winner

    def _handle_clue_phase(self, team: Team) -> bool:
        agents = self.team_agents[team]
        feedback: Optional[str] = None
        attempts = 0
        while attempts < self.max_attempts:
            user_prompt = self._build_spymaster_prompt(team, feedback)
            try:
                raw_response = agents.spymaster.invoke(user_prompt, attempt_number=attempts + 1, feedback=feedback)
            except Exception as exc:
                feedback = f'Error calling language model: {exc}'
                attempts += 1
                continue
            parsed = self._parse_json(raw_response)
            if parsed is None:
                feedback = "Response was not valid JSON. Only return the JSON object."
                attempts += 1
                continue
            clue_word = parsed.get("clue")
            clue_number = parsed.get("number")
            if not isinstance(clue_word, str) or not clue_word.strip().isalpha():
                feedback = "Clue must be a single alphabetical word."
                attempts += 1
                continue
            try:
                number_value = int(clue_number)
            except (TypeError, ValueError):
                feedback = "Number must be an integer between 0 and 4."
                attempts += 1
                continue
            if number_value < 0 or number_value > 4:
                feedback = "Number must be between 0 and 4 inclusive."
                attempts += 1
                continue
            clue_obj = Clue(clue_word.strip().upper(), number_value)
            try:
                self.game.submit_clue(clue_obj)
            except GameError as exc:
                feedback = f"Clue rejected: {exc}. Try again with a different clue."
                attempts += 1
                continue
            reasoning = parsed.get("reasoning", "")
            
            # Emit clue given event
            self._emit_event("clue_given", {
                "team": team.name,
                "clue": clue_obj.word,
                "number": clue_obj.number,
                "reasoning": reasoning,
                "turn_number": self.turn_counter
            })
            
            # Simple logging: use simple logger
            if self.simple_logging and self.simple_logger:
                self.simple_logger.log_clue(clue_obj.word, clue_obj.number)
            else:
                self._log(f"Spymaster clue: {clue_obj.word} {clue_obj.number}")
                if reasoning:
                    self._log(f"  Reasoning: {reasoning}")
                    
            self.history.append(
                f"Turn {self.turn_counter}: {team.name} clue {clue_obj.word} {clue_obj.number}"
            )
            return True
        return False

    def _handle_guess_phase(self, team: Team) -> bool:
        self._log_debug(f"[DEBUG] Entering guess phase for {team.name} team")
        self._log_debug(f"[DEBUG] Initial game phase: {self.game.phase}, current team: {self.game.current_team.name}")
        self._log_debug(f"[DEBUG] Guesses left: {self.game.guesses_left()}")
        
        feedback: Optional[str] = None
        guess_count = 0
        max_guess_attempts = 15  # Reduced from 50 to prevent long loops
        failed_words = set()  # Track words that have been tried and failed
        consecutive_invalid_attempts = 0  # Track consecutive invalid attempts
        
        while self.game.phase is Phase.AWAIT_GUESS and self.game.current_team is team and guess_count < max_guess_attempts:
            guess_count += 1
            self._log_debug(f"[DEBUG] Guess attempt #{guess_count}")
            self._log_debug(f"[DEBUG] Loop condition check - phase: {self.game.phase}, current_team: {self.game.current_team.name}, target_team: {team.name}")
            
            # Build more detailed feedback that includes available words after multiple failures
            enhanced_feedback = feedback
            if consecutive_invalid_attempts >= 3:
                available_words = []
                for position in all_positions():
                    card = self.game.board.get_card(position)
                    if not card.revealed:
                        available_words.append(card.word.upper())
                enhanced_feedback = f"{feedback or ''}\n\nAVAILABLE UNREVEALED WORDS: {', '.join(available_words)}\nDO NOT guess words that have already been revealed or are not on this list."
            
            user_prompt = self._build_operative_prompt(team, enhanced_feedback)
            try:
                self._log_debug(f"[DEBUG] Invoking operative agent for {team.name}")
                raw_response = self.team_agents[team].operative.invoke(user_prompt, attempt_number=guess_count, feedback=enhanced_feedback)
                self._log_debug(f"[DEBUG] Raw response received: {raw_response[:100]}...")
            except Exception as exc:
                self._log_debug(f"[DEBUG] Exception during agent invocation: {exc}")
                feedback = f'Error calling language model: {exc}'
                continue
                
            parsed = self._parse_json(raw_response)
            if parsed is None:
                self._log_debug(f"[DEBUG] Failed to parse JSON from response")
                feedback = "Response was not valid JSON. Reply only with the JSON payload."
                consecutive_invalid_attempts += 1
                
                # If we've failed to parse JSON too many times, force end turn
                if consecutive_invalid_attempts >= 8:
                    self._log_debug(f"[DEBUG] Too many consecutive invalid attempts ({consecutive_invalid_attempts}), forcing end turn")
                    try:
                        self.game.end_turn()
                        return True
                    except GameError:
                        return False
                continue
                
            action = parsed.get("action")
            reasoning = parsed.get("reasoning", "")
            if not isinstance(action, str):
                feedback = "The action field is missing."
                consecutive_invalid_attempts += 1
                continue
                
            action_lower = action.strip().lower()
            if action_lower == "end":
                # Emit turn ended event
                self._emit_event("turn_ended", {
                    "team": team.name,
                    "turn_number": self.turn_counter,
                    "reason": "voluntary",
                    "reasoning": reasoning
                })
                
                # Simple logging: use simple logger
                if self.simple_logging and self.simple_logger:
                    self.simple_logger.log_turn_end()
                else:
                    self._log("Operatives chose to end the turn.")
                    if reasoning:
                        self._log(f"  Reasoning: {reasoning}")
                        
                self.history.append(f"Turn {self.turn_counter}: {team.name} ended their guesses")
                try:
                    self.game.end_turn()
                except GameError as exc:
                    feedback = f"End turn failed: {exc}"
                    continue
                return True
                
            if action_lower != "guess":
                feedback = "Action must be either 'guess' or 'end'."
                consecutive_invalid_attempts += 1
                continue
                
            word = parsed.get("word")
            if not isinstance(word, str):
                feedback = "Guesses must include the word value."
                consecutive_invalid_attempts += 1
                continue
            
            # Use robust parsing to handle various input formats
            guess_word = self._parse_guess_input(word)
            if guess_word is None:
                consecutive_invalid_attempts += 1
                available_words = []
                for position in all_positions():
                    card = self.game.board.get_card(position)
                    if not card.revealed:
                        available_words.append(card.word.upper())
                feedback = f"Could not parse '{word}' as a valid board word. Available words: {', '.join(available_words[:10])}{'...' if len(available_words) > 10 else ''}"
                self._log_debug(f"[DEBUG] Available unrevealed words: {available_words}")
                self._log_debug(f"[DEBUG] Could not parse input '{word}' to any valid board word")
                continue
            
            # Check if this word was already tried and failed
            if guess_word in failed_words:
                consecutive_invalid_attempts += 1
                feedback = f"You already tried '{guess_word}' and it was invalid. Choose a different word from the available options."
                continue
            
            if not self._is_valid_guess_word(guess_word):
                consecutive_invalid_attempts += 1
                failed_words.add(guess_word)
                available_words = []
                for position in all_positions():
                    card = self.game.board.get_card(position)
                    if not card.revealed:
                        available_words.append(card.word.upper())
                feedback = f"'{guess_word}' is not available for guessing (already revealed or not on board). Available words: {', '.join(available_words[:8])}{'...' if len(available_words) > 8 else ''}"
                self._log_debug(f"[DEBUG] Word '{guess_word}' was parsed but is not available for guessing")
                continue
            
            # Reset consecutive invalid attempts on successful parsing
            consecutive_invalid_attempts = 0
            
            try:
                self._log_debug(f"[DEBUG] Making guess: {guess_word}")
                result = self.game.guess_by_word(guess_word)
                self._log_debug(f"[DEBUG] Guess result - ended_turn: {result.ended_turn}, team_won: {result.team_won}, assassin_hit: {result.assassin_hit}")
            except GameError as exc:
                self._log_debug(f"[DEBUG] Guess rejected: {exc}")
                feedback = f"Guess rejected: {exc}"
                failed_words.add(guess_word)
                continue
                
            self._report_guess_result(team, result, reasoning)
            
            self._log_debug(f"[DEBUG] After guess - game phase: {self.game.phase}, current team: {self.game.current_team.name}")
            
            if self.game.phase is Phase.FINISHED:
                self._log_debug(f"[DEBUG] Game finished, returning True")
                return True
            if result.ended_turn:
                self._log_debug(f"[DEBUG] Turn ended, returning True")
                return True
            
            self._log_debug(f"[DEBUG] Continuing guess loop - guesses left: {self.game.guesses_left()}")
            feedback = None  # Clear feedback on successful guess
            
        if guess_count >= max_guess_attempts:
            self._log_debug(f"[DEBUG] Hit maximum guess attempts ({max_guess_attempts}), ending turn to prevent infinite loop")
            try:
                self.game.end_turn()
            except GameError:
                pass  # Game might already be in a different state
        
        self._log_debug(f"[DEBUG] Exiting guess phase loop")
        return True

    def _report_guess_result(self, team: Team, result: GuessResult, reasoning: str) -> None:
        card = result.card
        owner = card.card_type.team
        owner_label = owner.name if owner else card.card_type.name
        guesses_left = self.game.guesses_left()
        
        # Emit guess made event
        self._emit_event("guess_made", {
            "team": team.name,
            "word": card.word.upper(),
            "card_type": card.card_type.name,
            "reasoning": reasoning,
            "ended_turn": result.ended_turn,
            "assassin_hit": result.assassin_hit,
            "team_won": result.team_won.name if result.team_won else None,
            "guesses_left": guesses_left,
            "turn_number": self.turn_counter,
            "red_remaining": self.game.remaining[Team.RED],
            "blue_remaining": self.game.remaining[Team.BLUE]
        })
        
        # Simple logging: use simple logger
        if self.simple_logging and self.simple_logger:
            self.simple_logger.log_guess_result_with_remaining(team, result, guesses_left)
        else:
            self._log(f"Operatives guessed {card.word.upper()} — {owner_label}")
            if reasoning:
                self._log(f"  Reasoning: {reasoning}")
            if result.assassin_hit:
                self._log("  Assassin revealed! Game ends immediately.")
            if result.team_won is not None:
                self._log(f"  {result.team_won.name} team wins by revealing all their words!")
            if guesses_left and self.game.phase is Phase.AWAIT_GUESS:
                self._log(f"  Guesses remaining this turn: {guesses_left}")
                
        label = position_to_label(result.position)
        outcome = (
            f"{team.name} guessed {label} {card.word.upper()} -> {owner_label}"
        )
        self.history.append(outcome)

    def _is_valid_guess_word(self, guess_word: str) -> bool:
        position = self.game.board.find_word(guess_word)
        if position is None:
            return False
        return not self.game.board.get_card(position).revealed
    
    def _parse_guess_input(self, raw_input: str) -> Optional[str]:
        """
        Robust parsing function that handles multiple input formats:
        - Direct words: "BATTERY", "battery", "Battery" 
        - Position labels: "A3", "B2", "C4"
        - Combined formats: "A3 BATTERY", "B2: Computer"
        
        Returns the actual board word in uppercase, or None if invalid.
        """
        if not raw_input or not isinstance(raw_input, str):
            return None
            
        raw_input = raw_input.strip()
        if not raw_input:
            return None
        
        # Try multiple parsing strategies
        candidates = []
        
        # Strategy 1: Direct word lookup (case-insensitive)
        candidates.append(raw_input.upper())
        
        # Strategy 2: Handle position labels like "A3", "B2" 
        if len(raw_input) == 2 and raw_input[0].isalpha() and raw_input[1].isdigit():
            position = self._parse_position_label(raw_input.upper())
            if position:
                card = self.game.board.get_card(position)
                candidates.append(card.word.upper())
        
        # Strategy 3: Handle combined formats like "A3 BATTERY" or "B2: Computer"
        if " " in raw_input or ":" in raw_input:
            # Split on common separators
            parts = raw_input.replace(":", " ").split()
            for part in parts:
                part = part.strip()
                if not part:
                    continue
                    
                # Check if this part is a position label
                if len(part) == 2 and part[0].isalpha() and part[1].isdigit():
                    position = self._parse_position_label(part.upper())
                    if position:
                        card = self.game.board.get_card(position)
                        candidates.append(card.word.upper())
                else:
                    # Treat as potential word
                    candidates.append(part.upper())
        
        # Strategy 4: Handle variations with extra characters
        cleaned = ''.join(c for c in raw_input if c.isalpha()).upper()
        if cleaned:
            candidates.append(cleaned)
        
        # Test each candidate to see if it's a valid board word
        for candidate in candidates:
            if self._is_word_on_board(candidate):
                return candidate
                
        return None
    
    def _parse_position_label(self, label: str) -> Optional[Position]:
        """Convert position label like 'A3' to Position object."""
        if len(label) != 2 or not label[0].isalpha() or not label[1].isdigit():
            return None
            
        col_letter = label[0].upper()
        row_num = label[1]
        
        # Convert letter to column index (A=0, B=1, C=2, D=3, E=4)
        if col_letter < 'A' or col_letter > 'E':
            return None
        col_idx = ord(col_letter) - ord('A')
        
        # Convert number to row index (1=0, 2=1, 3=2, 4=3, 5=4)
        if row_num < '1' or row_num > '5':
            return None
        row_idx = int(row_num) - 1
        
        if 0 <= row_idx < BOARD_SIZE and 0 <= col_idx < BOARD_SIZE:
            return Position(row=row_idx, col=col_idx)
        return None
    
    def _is_word_on_board(self, word: str) -> bool:
        """Check if a word exists on the board (case-insensitive)."""
        for position in all_positions():
            card = self.game.board.get_card(position)
            if card.word.upper() == word.upper():
                return True
        return False

    def _build_spymaster_prompt(self, team: Team, feedback: Optional[str]) -> str:
        board = self.game.board
        my_unrevealed: List[str] = []
        my_revealed: List[str] = []
        opponents: List[str] = []
        neutrals: List[str] = []
        assassin = "?"
        for position in all_positions():
            card = board.get_card(position)
            label = position_to_label(position)
            status = "REVEALED" if card.revealed else "HIDDEN"
            descriptor = f"{label} {card.word.upper()} ({status})"
            if card.card_type is CardType.ASSASSIN:
                assassin = descriptor
            elif card.card_type.team is team:
                if card.revealed:
                    my_revealed.append(descriptor)
                else:
                    my_unrevealed.append(f"{label} {card.word.upper()}")
            elif card.card_type.team is team.opponent():
                opponents.append(descriptor)
            else:
                neutrals.append(descriptor)
        remaining_counts = {
            team.name: self.game.remaining[team],
            team.opponent().name: self.game.remaining[team.opponent()],
        }
        prompt = build_spymaster_user_prompt(
            team_name=team.name,
            unrevealed_team_words=my_unrevealed,
            revealed_team_words=my_revealed,
            opponent_words=opponents,
            neutral_words=neutrals,
            assassin_word=assassin,
            remaining=remaining_counts,
            history=self.history,
            feedback=feedback,
        )
        self.team_agents[team].spymaster.system_prompt = spymaster_system_prompt(team.name)
        return prompt

    def _build_operative_prompt(self, team: Team, feedback: Optional[str]) -> str:
        rows: List[str] = []
        board = self.game.board
        for row_idx in range(BOARD_SIZE):
            entries: List[str] = []
            for col_idx in range(BOARD_SIZE):
                position = Position(row=row_idx, col=col_idx)
                label = position_to_label(position)
                card = board.get_card(position)
                if card.revealed:
                    descriptor = f"{label} {card.word.upper()} ({card.card_type.name})"
                else:
                    descriptor = f"{label} {card.word.upper()}"
                entries.append(descriptor)
            rows.append(", ".join(entries))
        last_clue = (
            f"{self.game.current_clue.word} {self.game.current_clue.number}"
            if self.game.current_clue
            else "None"
        )
        prompt = build_operative_user_prompt(
            team_name=team.name,
            visible_board_rows=rows,
            last_clue=last_clue,
            guesses_left=self.game.guesses_left(),
            remaining_self=self.game.remaining[team],
            remaining_opponent=self.game.remaining[team.opponent()],
            history=self.history,
            feedback=feedback,
        )
        self.team_agents[team].operative.system_prompt = operative_system_prompt(team.name)
        return prompt

    def _parse_json(self, text: str) -> Optional[Dict[str, object]]:
        text = text.strip()
        if not text:
            return None
        
        # Strip code fences if present
        if text.startswith("```"):
            text = self._strip_code_fence(text)
        
        # Try parsing the entire text first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON object in the text
        match = JSON_OBJECT_PATTERN.search(text)
        if match:
            candidate = match.group(0)
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass
        
        # If still failing, try to fix common JSON issues
        # Remove trailing commas, fix incomplete objects, etc.
        try:
            # Find the last complete JSON object
            lines = text.split('\n')
            json_lines = []
            brace_count = 0
            in_json = False
            
            for line in lines:
                if '{' in line and not in_json:
                    in_json = True
                    json_lines = [line]
                    brace_count = line.count('{') - line.count('}')
                elif in_json:
                    json_lines.append(line)
                    brace_count += line.count('{') - line.count('}')
                    if brace_count <= 0:
                        break
            
            if json_lines and brace_count <= 0:
                candidate = '\n'.join(json_lines)
                # Try to fix trailing commas
                candidate = candidate.rstrip().rstrip(',')
                if candidate.endswith('}'):
                    return json.loads(candidate)
        except (json.JSONDecodeError, IndexError, AttributeError):
            pass
        
        return None

    @staticmethod
    def _strip_code_fence(block: str) -> str:
        lines = block.strip().splitlines()
        if len(lines) >= 2 and lines[0].startswith("```"):
            lines = [line for line in lines[1:] if not line.startswith("```")]
        return "\n".join(lines).strip()


__all__ = ["AIMatch"]
