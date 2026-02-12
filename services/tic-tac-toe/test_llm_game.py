#!/usr/bin/env python3
"""
Test script for running LLM vs LLM tic-tac-toe games locally.
Usage: python test_llm_game.py
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from game import Game
from player import Player

def print_separator():
    print("\n" + "="*60 + "\n")

def main():
    """Run a test game between two LLM players."""
    
    print_separator()
    print("🎮 TIC-TAC-TOE LLM BATTLE")
    print_separator()
    
    # Check for API keys
    if not os.getenv('OPENAI_API_KEY') and not os.getenv('MISTRAL_API_KEY'):
        print("⚠️  Warning: No API keys found in environment!")
        print("   Set OPENAI_API_KEY or MISTRAL_API_KEY in .env file")
        print("   Falling back to random players...")
        print_separator()
        
        use_llm = False
    else:
        use_llm = True
        print("✓ API keys detected")
        print_separator()
    
    # Configure players
    print("Creating players...")
    
    if use_llm:
        player_x = Player(
            symbol='X',
            use_llm=True,
            provider='openai',
            model='gpt-4o-mini',
            temperature=0.7
        )
        
        player_o = Player(
            symbol='O',
            use_llm=True,
            provider='openai',
            model='gpt-4o-mini',
            temperature=0.9
        )
        
        print(f"  Player X: {player_x.name}")
        print(f"  Player O: {player_o.name}")
    else:
        player_x = Player(symbol='X', name='Random X')
        player_o = Player(symbol='O', name='Random O')
        print(f"  Player X: Random")
        print(f"  Player O: Random")
    
    print_separator()
    
    # Create game
    print("Initializing game...")
    game = Game(
        player_x=player_x,
        player_o=player_o,
        enable_logging=True
    )
    
    print(f"Game ID: {game.game_id}")
    print_separator()
    
    # Play the game
    print("🎲 Starting game...\n")
    
    move_count = 0
    while not game.game_over:
        move_count += 1
        print(f"Move {move_count}:")
        print(f"  Current player: {game.current_player.name}")
        
        result = game.make_move()
        
        if result['success']:
            move_info = result.get('move', {})
            print(f"  Played: ({move_info.get('row')}, {move_info.get('col')})")
            
            # Show reasoning if available
            metadata = result.get('metadata', {})
            reasoning = metadata.get('reasoning')
            if reasoning:
                print(f"  Reasoning: {reasoning}")
            
            # Show response time
            response_time = metadata.get('response_time_ms')
            if response_time:
                print(f"  Response time: {response_time:.0f}ms")
        else:
            print(f"  Error: {result['message']}")
        
        # Display board
        print("\n  Board:")
        for i, row in enumerate(result['board']):
            row_display = "  " + " | ".join([cell if cell else " " for cell in row])
            print(row_display)
            if i < 2:
                print("  " + "-" * 9)
        
        print()
    
    # Game over
    print_separator()
    print("🏁 GAME OVER")
    print_separator()
    
    if game.winner:
        winner_name = game.player_x.name if game.winner == 'X' else game.player_o.name
        print(f"🎉 Winner: {winner_name} ({game.winner})")
    else:
        print("🤝 Draw!")
    
    print(f"\nTotal moves: {len(game.move_history)}")
    print(f"Duration: {(game.logger.log_move.__self__ if game.logger else None)}")
    
    # Show log file locations
    if game.logger:
        paths = game.logger.get_log_paths()
        print("\n📊 Logs saved to:")
        print(f"  Moves: {paths['moves']}")
        print(f"  Games: {paths['games']}")
    
    print_separator()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nGame interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

