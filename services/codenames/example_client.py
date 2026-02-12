"""
Example client for the Codenames AI Arena API.

This script demonstrates how to:
1. Start a game
2. Connect via WebSocket to receive real-time updates
3. Display game events as they happen
"""

import asyncio
import json
from typing import Any, Dict

import requests
import websockets


API_BASE_URL = "http://127.0.0.1:8002"
WS_BASE_URL = "ws://127.0.0.1:8002"


def start_game(config: Dict[str, Any]) -> Dict[str, Any]:
    """Start a new game and return the game info."""
    print("🎮 Starting new game...")
    response = requests.post(f"{API_BASE_URL}/api/games", json=config)
    response.raise_for_status()
    game_data = response.json()
    print(f"✅ Game started: {game_data['game_id']}")
    print(f"   Starting team: {game_data['current_team']}")
    print(f"   Red cards: {game_data['red_remaining']}, Blue cards: {game_data['blue_remaining']}")
    return game_data


def list_available_models():
    """List all available LLM models."""
    print("📋 Available models:")
    response = requests.get(f"{API_BASE_URL}/api/models")
    response.raise_for_status()
    models = response.json()
    for model in models:
        print(f"   - {model['provider']}/{model['model']}")
    return models


async def watch_game(game_id: str):
    """Connect to a game via WebSocket and watch it in real-time."""
    uri = f"{WS_BASE_URL}/ws/games/{game_id}"
    print(f"\n🔌 Connecting to WebSocket: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected! Watching game...\n")
            
            while True:
                try:
                    message = await websocket.recv()
                    event = json.loads(message)
                    handle_event(event)
                    
                    # Exit if game ended
                    if event['event_type'] == 'game_ended':
                        print("\n🏁 Game finished!")
                        break
                        
                except websockets.exceptions.ConnectionClosed:
                    print("❌ Connection closed")
                    break
                    
    except Exception as e:
        print(f"❌ Error: {e}")


def handle_event(event: Dict[str, Any]):
    """Handle and display a game event."""
    event_type = event['event_type']
    data = event['data']
    
    if event_type == 'game_state':
        print(f"📊 Game State:")
        print(f"   Phase: {data['phase']}")
        print(f"   Current team: {data['current_team']}")
        print(f"   Turn: {data['turn_number']}")
        print(f"   Red: {data['red_remaining']} | Blue: {data['blue_remaining']}")
        
    elif event_type == 'game_started':
        print(f"🎲 Game Started!")
        print(f"   Starting team: {data['starting_team']}")
        print(f"   Red cards: {data['red_cards']} | Blue cards: {data['blue_cards']}")
        
    elif event_type == 'turn_started':
        print(f"\n{'='*60}")
        print(f"🔄 Turn {data['turn_number']} - {data['team']} team")
        print(f"   Cards remaining - Red: {data['red_remaining']} | Blue: {data['blue_remaining']}")
        
    elif event_type == 'clue_given':
        print(f"\n💡 Spymaster's Clue: {data['clue']} {data['number']}")
        if data.get('reasoning'):
            print(f"   Reasoning: {data['reasoning']}")
        
    elif event_type == 'guess_made':
        card_type = data['card_type']
        team = data['team']
        
        # Color code the output
        if card_type == 'ASSASSIN':
            indicator = "💀"
        elif card_type == team:
            indicator = "✅"
        elif card_type == 'NEUTRAL':
            indicator = "⚪"
        else:
            indicator = "❌"
        
        print(f"\n   {indicator} Guess: {data['word']} → {card_type}")
        if data.get('reasoning'):
            print(f"      Reasoning: {data['reasoning']}")
        
        if data.get('assassin_hit'):
            print(f"      💀 ASSASSIN HIT! Game over!")
        elif data.get('team_won'):
            print(f"      🎉 {data['team_won']} team wins!")
        else:
            print(f"      Guesses left: {data['guesses_left']}")
            print(f"      Red: {data['red_remaining']} | Blue: {data['blue_remaining']}")
        
    elif event_type == 'turn_ended':
        print(f"\n🔚 Turn ended ({data['reason']})")
        if data.get('reasoning'):
            print(f"   Reasoning: {data['reasoning']}")
        
    elif event_type == 'game_ended':
        print(f"\n{'='*60}")
        print(f"🏆 Winner: {data['winner'] or 'TIE'}")
        print(f"   Total turns: {data['total_turns']}")
        print(f"   Final score - Red: {data['red_remaining']} | Blue: {data['blue_remaining']}")
        if data.get('assassin_revealed'):
            print(f"   💀 Assassin was revealed")


async def main():
    """Main function to run the example."""
    print("=" * 60)
    print("Codenames AI Arena - Example Client")
    print("=" * 60)
    print()
    
    # List available models
    list_available_models()
    print()
    
    # Configure game
    game_config = {
        "red_spymaster": {
            "provider": "mistral",
            "model": "mistral-medium-latest",
            "temperature": 0.6
        },
        "red_operative": {
            "provider": "mistral",
            "model": "mistral-medium-latest",
            "temperature": 0.5
        },
        "blue_spymaster": {
            "provider": "mistral",
            "model": "mistral-large-latest",
            "temperature": 0.6
        },
        "blue_operative": {
            "provider": "mistral",
            "model": "mistral-medium-latest",
            "temperature": 0.5
        },
        "seed": None  # Random seed
    }
    
    # Start game
    try:
        game_data = start_game(game_config)
        game_id = game_data['game_id']
        
        # Watch game via WebSocket
        await watch_game(game_id)
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure the server is running:")
        print("   python run_api.py")
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

