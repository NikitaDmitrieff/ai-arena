"""Player class for the tic-tac-toe game."""

import random
import json
import time
from typing import Optional, Tuple, Dict, Any

from nikitas_agents import BaseAgent

from prompts import SYSTEM_PROMPT, get_move_prompt, ERROR_RECOVERY_PROMPT


class Player:
    """Represents a player in the tic-tac-toe game."""
    
    def __init__(
        self,
        symbol: str,
        name: Optional[str] = None,
        agent: Optional[Any] = None,
        use_llm: bool = False,
        provider: str = "openai",
        model: str = "gpt-4o-mini",
        temperature: float = 0.7
    ):
        """
        Initialize a player.
        
        Args:
            symbol: 'X' or 'O'
            name: Optional name for the player
            agent: Optional BaseAgent instance (if None, creates one if use_llm=True)
            use_llm: Whether to use LLM for move selection
            provider: LLM provider ('openai' or 'mistral')
            model: Model name
            temperature: Temperature for LLM sampling
        """
        self.symbol = symbol
        self.agent = agent
        self.use_llm = use_llm
        self.provider = provider
        self.model = model
        self.temperature = temperature
        
        # Initialize agent if use_llm is True and no agent provided
        if use_llm and agent is None:
            try:
                self.agent = BaseAgent(
                    name=f"TicTacToe_{symbol}",
                    description=f"Tic-tac-toe player {symbol}",
                    provider=provider,
                    model=model
                )
            except Exception as e:
                print(f"Warning: Could not create LLM agent: {e}. Falling back to random moves.")
                self.use_llm = False
        
        # Set name
        if name:
            self.name = name
        elif self.use_llm and self.agent:
            self.name = f"{symbol} ({model})"
        else:
            self.name = f"Player {symbol}"
        
        # Track move history
        self.move_history = []
        self.last_prompt = None
        self.last_response = None
        self.last_reasoning = None
        self.last_response_time = None
    
    def choose_move(
        self,
        available_moves: list,
        board_state: Optional[list] = None
    ) -> Tuple[Optional[Tuple[int, int]], Dict[str, Any]]:
        """
        Choose a move from available moves.
        
        Args:
            available_moves: List of (row, col) tuples
            board_state: Current board state (needed for LLM)
            
        Returns:
            Tuple of (move, metadata) where move is (row, col) or None,
            and metadata contains prompt, response, reasoning, etc.
        """
        if not available_moves:
            return None, {}
        
        metadata = {
            'player_type': 'llm' if self.use_llm else 'random',
            'prompt': None,
            'response': None,
            'reasoning': None,
            'response_time_ms': None,
            'error': None
        }
        
        # Use LLM if enabled and agent is available
        if self.use_llm and self.agent and board_state is not None:
            move, llm_metadata = self._choose_move_llm(available_moves, board_state)
            metadata.update(llm_metadata)
            
            # Fallback to random if LLM fails
            if move is None or move not in available_moves:
                print(f"Warning: LLM move failed or invalid. Using random fallback.")
                move = random.choice(available_moves)
                metadata['error'] = 'LLM move invalid, used random fallback'
        else:
            # Random move
            move = random.choice(available_moves)
        
        # Record move
        self.move_history.append(move)
        self.last_prompt = metadata.get('prompt')
        self.last_response = metadata.get('response')
        self.last_reasoning = metadata.get('reasoning')
        self.last_response_time = metadata.get('response_time_ms')
        
        return move, metadata
    
    def _choose_move_llm(
        self,
        available_moves: list,
        board_state: list
    ) -> Tuple[Optional[Tuple[int, int]], Dict[str, Any]]:
        """
        Choose a move using LLM.
        
        Args:
            available_moves: List of (row, col) tuples
            board_state: Current board state
            
        Returns:
            Tuple of (move, metadata)
        """
        metadata = {
            'prompt': None,
            'response': None,
            'reasoning': None,
            'response_time_ms': None,
            'error': None
        }
        
        # Generate prompt
        user_prompt = get_move_prompt(board_state, self.symbol, available_moves)
        metadata['prompt'] = user_prompt
        
        # Query LLM
        start_time = time.time()
        try:
            response = self.agent.invoke(
                user_prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT,
                temperature=self.temperature,
                max_output_tokens=256
            )
            response_time = (time.time() - start_time) * 1000
            metadata['response_time_ms'] = response_time
            metadata['response'] = response
            
            # Parse response
            move, reasoning = self._parse_llm_response(response, available_moves)
            metadata['reasoning'] = reasoning
            
            if move and move in available_moves:
                return move, metadata
            else:
                metadata['error'] = f"Invalid move {move} not in available moves"
                return None, metadata
                
        except Exception as e:
            metadata['error'] = str(e)
            print(f"Error querying LLM: {e}")
            return None, metadata
    
    def _parse_llm_response(
        self,
        response: str,
        available_moves: list
    ) -> Tuple[Optional[Tuple[int, int]], Optional[str]]:
        """
        Parse LLM response to extract move.
        
        Args:
            response: Raw LLM response
            available_moves: List of valid moves
            
        Returns:
            Tuple of (move, reasoning)
        """
        try:
            # Try to find JSON in response
            response = response.strip()
            
            # Handle markdown code blocks
            if '```json' in response:
                response = response.split('```json')[1].split('```')[0].strip()
            elif '```' in response:
                response = response.split('```')[1].split('```')[0].strip()
            
            # Parse JSON
            data = json.loads(response)
            
            row = data.get('row')
            col = data.get('col')
            reasoning = data.get('reasoning', 'No reasoning provided')
            
            if row is not None and col is not None:
                return (int(row), int(col)), reasoning
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"Error parsing LLM response: {e}")
            print(f"Response was: {response[:200]}")
        
        return None, None
    
    def get_player_type(self) -> str:
        """Get the player type ('random' or 'llm')."""
        return 'llm' if self.use_llm else 'random'
    
    def get_model_name(self) -> Optional[str]:
        """Get the model name if using LLM."""
        return self.model if self.use_llm else None
    
    def __str__(self):
        """String representation of the player."""
        return f"{self.name} ({self.symbol})"
