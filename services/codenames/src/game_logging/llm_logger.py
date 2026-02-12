from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


@dataclass
class LLMMessage:
    """Represents a single LLM interaction message - simplified."""
    timestamp: str
    game_number: int
    turn_number: int
    team: str
    role: str  # 'spymaster' or 'operative'
    model_info: str
    response: str
    attempt_number: int = 1  # For retry attempts
    parsed_json: Optional[Dict[str, Any]] = None  # Successfully parsed JSON response
    parse_error: Optional[str] = None  # JSON parsing error if any


@dataclass
class GameConversation:
    """Contains all LLM messages for a single game."""
    game_number: int
    messages: List[LLMMessage] = field(default_factory=list)
    game_start_time: Optional[str] = None
    game_end_time: Optional[str] = None
    winner: Optional[str] = None
    total_turns: int = 0


class LLMMessageLogger:
    """Logs all LLM messages and conversations during tournament play."""
    
    def __init__(self, results_folder: Path):
        self.results_folder = results_folder
        self.current_game_number = 0
        self.current_turn_number = 0
        self.conversations: Dict[int, GameConversation] = {}
        self.session_start_time = datetime.now()
        
    def start_game(self, game_number: int) -> None:
        """Initialize logging for a new game."""
        self.current_game_number = game_number
        self.current_turn_number = 0
        self.conversations[game_number] = GameConversation(
            game_number=game_number,
            game_start_time=datetime.now().isoformat()
        )
        
    def start_turn(self, turn_number: int) -> None:
        """Start a new turn."""
        self.current_turn_number = turn_number
        
    def end_game(self, winner: Optional[str], total_turns: int) -> None:
        """Finalize logging for the current game."""
        if self.current_game_number in self.conversations:
            conversation = self.conversations[self.current_game_number]
            conversation.game_end_time = datetime.now().isoformat()
            conversation.winner = winner
            conversation.total_turns = total_turns
    
    def log_llm_interaction(
        self,
        team: str,
        role: str,
        agent_name: str,
        model_info: str,
        system_prompt: str,
        user_prompt: str,
        response: str,
        response_time: float,
        temperature: float,
        max_output_tokens: int,
        attempt_number: int = 1,
        feedback: Optional[str] = None,
        parsed_json: Optional[Dict[str, Any]] = None,
        parse_error: Optional[str] = None
    ) -> None:
        """Log a single LLM interaction - simplified."""
        message = LLMMessage(
            timestamp=datetime.now().isoformat(),
            game_number=self.current_game_number,
            turn_number=self.current_turn_number,
            team=team,
            role=role,
            model_info=model_info,
            response=response,
            attempt_number=attempt_number,
            parsed_json=parsed_json,
            parse_error=parse_error
        )
        
        if self.current_game_number not in self.conversations:
            self.start_game(self.current_game_number)
            
        self.conversations[self.current_game_number].messages.append(message)
    
    def save_all_conversations(self) -> None:
        """Save all logged conversations to files."""
        if not self.conversations:
            return
            
        # Create conversations subfolder
        conversations_folder = self.results_folder / "llm_conversations"
        conversations_folder.mkdir(exist_ok=True)
        
        # Save individual game conversations
        for game_num, conversation in self.conversations.items():
            self._save_game_conversation(conversation, conversations_folder)
        
        # Save master conversation log
        self._save_master_conversation_log(conversations_folder)
        
        # Save conversation summary statistics
        self._save_conversation_statistics(conversations_folder)
    
    def _save_game_conversation(self, conversation: GameConversation, folder: Path) -> None:
        """Save a single game's conversation to both JSON and human-readable formats."""
        game_num = conversation.game_number
        
        # JSON format for programmatic access
        json_file = folder / f"game_{game_num:03d}_conversation.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            # Convert dataclass to dict for JSON serialization
            conversation_dict = {
                'game_number': conversation.game_number,
                'game_start_time': conversation.game_start_time,
                'game_end_time': conversation.game_end_time,
                'winner': conversation.winner,
                'total_turns': conversation.total_turns,
                'messages': [
                    {
                        'timestamp': msg.timestamp,
                        'game_number': msg.game_number,
                        'turn_number': msg.turn_number,
                        'team': msg.team,
                        'role': msg.role,
                        'model_info': msg.model_info,
                        'response': msg.response,
                        'attempt_number': msg.attempt_number,
                        'parsed_json': msg.parsed_json,
                        'parse_error': msg.parse_error
                    }
                    for msg in conversation.messages
                ]
            }
            json.dump(conversation_dict, f, indent=2, ensure_ascii=False)
        
        # Human-readable format
        txt_file = folder / f"game_{game_num:03d}_conversation.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(f"GAME {game_num} CONVERSATION LOG\n")
            f.write("=" * 80 + "\n")
            f.write(f"Start Time: {conversation.game_start_time}\n")
            f.write(f"End Time: {conversation.game_end_time}\n")
            f.write(f"Winner: {conversation.winner or 'Unknown'}\n")
            f.write(f"Total Turns: {conversation.total_turns}\n")
            f.write(f"Total Messages: {len(conversation.messages)}\n")
            f.write("\n" + "=" * 80 + "\n\n")
            
            current_turn = None
            for msg in conversation.messages:
                if msg.turn_number != current_turn:
                    current_turn = msg.turn_number
                    f.write(f"\n{'='*60}\n")
                    f.write(f"TURN {current_turn}\n")
                    f.write(f"{'='*60}\n\n")
                
                f.write(f"[{msg.timestamp}] {msg.team} {msg.role.upper()}\n")
                f.write(f"Model: {msg.model_info}\n")
                
                if msg.attempt_number > 1:
                    f.write(f"Attempt: #{msg.attempt_number}\n")
                
                f.write("RESPONSE:\n")
                f.write("-" * 40 + "\n")
                f.write(msg.response + "\n\n")
                
                if msg.parsed_json:
                    f.write("PARSED JSON:\n")
                    f.write("-" * 40 + "\n")
                    f.write(json.dumps(msg.parsed_json, indent=2) + "\n\n")
                
                if msg.parse_error:
                    f.write(f"PARSE ERROR: {msg.parse_error}\n\n")
                
                f.write("-" * 80 + "\n\n")
    
    def _save_master_conversation_log(self, folder: Path) -> None:
        """Save a master log with all conversations combined."""
        master_file = folder / "master_conversation_log.json"
        
        all_conversations = []
        for conversation in self.conversations.values():
            conversation_dict = {
                'game_number': conversation.game_number,
                'game_start_time': conversation.game_start_time,
                'game_end_time': conversation.game_end_time,
                'winner': conversation.winner,
                'total_turns': conversation.total_turns,
                'message_count': len(conversation.messages),
                'messages': [
                    {
                        'timestamp': msg.timestamp,
                        'game_number': msg.game_number,
                        'turn_number': msg.turn_number,
                        'team': msg.team,
                        'role': msg.role,
                        'model_info': msg.model_info,
                        'attempt_number': msg.attempt_number,
                        'successfully_parsed': msg.parsed_json is not None,
                        'has_parse_error': msg.parse_error is not None,
                        'response': msg.response,
                        'parsed_json': msg.parsed_json,
                        'parse_error': msg.parse_error
                    }
                    for msg in conversation.messages
                ]
            }
            all_conversations.append(conversation_dict)
        
        master_data = {
            'session_start_time': self.session_start_time.isoformat(),
            'total_games': len(self.conversations),
            'total_messages': sum(len(conv.messages) for conv in self.conversations.values()),
            'conversations': all_conversations
        }
        
        with open(master_file, 'w', encoding='utf-8') as f:
            json.dump(master_data, f, indent=2, ensure_ascii=False)
    
    def _save_conversation_statistics(self, folder: Path) -> None:
        """Save statistics about the conversations."""
        stats_file = folder / "conversation_statistics.txt"
        
        total_messages = sum(len(conv.messages) for conv in self.conversations.values())
        
        # Count by role and team - simplified
        role_stats = {}
        team_stats = {}
        model_stats = {}
        retry_stats = {'total_retries': 0, 'successful_retries': 0}
        
        for conversation in self.conversations.values():
            for msg in conversation.messages:
                # Role stats
                role_key = f"{msg.team}_{msg.role}"
                if role_key not in role_stats:
                    role_stats[role_key] = {'count': 0}
                role_stats[role_key]['count'] += 1
                
                # Team stats
                if msg.team not in team_stats:
                    team_stats[msg.team] = {'count': 0}
                team_stats[msg.team]['count'] += 1
                
                # Model stats
                if msg.model_info not in model_stats:
                    model_stats[msg.model_info] = {'count': 0, 'parse_errors': 0}
                model_stats[msg.model_info]['count'] += 1
                if msg.parse_error:
                    model_stats[msg.model_info]['parse_errors'] += 1
                
                # Retry stats
                if msg.attempt_number > 1:
                    retry_stats['total_retries'] += 1
                    if msg.parsed_json is not None:
                        retry_stats['successful_retries'] += 1
        
        with open(stats_file, 'w', encoding='utf-8') as f:
            f.write("LLM CONVERSATION STATISTICS\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"Total Games: {len(self.conversations)}\n")
            f.write(f"Total Messages: {total_messages}\n\n")
            
            f.write("ROLE STATISTICS:\n")
            f.write("-" * 30 + "\n")
            for role, stats in sorted(role_stats.items()):
                f.write(f"{role}: {stats['count']} messages\n")
            
            f.write("\nTEAM STATISTICS:\n")
            f.write("-" * 30 + "\n")
            for team, stats in sorted(team_stats.items()):
                f.write(f"{team}: {stats['count']} messages\n")
            
            f.write("\nMODEL STATISTICS:\n")
            f.write("-" * 30 + "\n")
            for model, stats in sorted(model_stats.items()):
                error_rate = stats['parse_errors'] / stats['count'] * 100 if stats['count'] > 0 else 0
                f.write(f"{model}:\n")
                f.write(f"  Messages: {stats['count']}\n")
                f.write(f"  Parse Error Rate: {error_rate:.1f}%\n\n")
            
            f.write("RETRY STATISTICS:\n")
            f.write("-" * 30 + "\n")
            f.write(f"Total Retries: {retry_stats['total_retries']}\n")
            f.write(f"Successful Retries: {retry_stats['successful_retries']}\n")
            if retry_stats['total_retries'] > 0:
                success_rate = retry_stats['successful_retries'] / retry_stats['total_retries'] * 100
                f.write(f"Retry Success Rate: {success_rate:.1f}%\n")


__all__ = ["LLMMessage", "GameConversation", "LLMMessageLogger"]
