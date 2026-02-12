# Debugging Real-Time Updates - Analysis & Fix

## Problem Statement

The canvas was not updating in real-time. Speech bubbles and character sprites only appeared AFTER the game completed, instead of showing messages as they arrived via WebSocket.

## Root Cause Analysis

### Issue #1: Race Condition - Characters Not Initialized When Messages Arrive

**Problem**: Messages were arriving via WebSocket BEFORE characters were initialized on the canvas.

**Flow**:

1. Game is created → WebSocket connects
2. WebSocket receives "connected" event → `fetchGameStatus()` is called
3. Initial game state may have `players: null` or `players: []`
4. Canvas component renders but characters are NOT initialized (requires `game.players.length > 0`)
5. Messages start arriving via WebSocket and are added to `game.messages` array
6. Message processing `useEffect` tries to add speech bubbles
7. **BUT** characters aren't initialized yet, so `charactersRef.current.size === 0`
8. `addSpeechBubble()` is called but character not found → silently fails
9. Game completes → `fetchGameStatus()` is called again
10. NOW `game.players` is populated → characters initialize
11. All messages appear at once

### Issue #2: No Guard Against Uninitialized Characters

The message processing `useEffect` had no check to ensure characters were initialized before trying to add speech bubbles.

```typescript
// OLD CODE - No guard
useEffect(() => {
  if (!game.messages || game.messages.length === 0) return;
  const newMessages = game.messages.slice(processedMessageCountRef.current);
  newMessages.forEach((message, index) => {
    setTimeout(() => {
      addSpeechBubble(message.player, message.content); // May fail silently!
      processedMessageCountRef.current++;
    }, index * MESSAGE_DELAY);
  });
}, [game.messages, addSpeechBubble]);
```

### Issue #3: Backend May Not Populate Players Immediately

When a game is created, the backend may return:

```json
{
  "game_id": "...",
  "status": "pending",
  "players": null, // NOT YET POPULATED!
  "messages": null
}
```

Players are only populated AFTER the backend starts processing the game in a background task.

## Solution Implemented

### Fix #1: Add `charactersInitialized` State Flag

Added a state variable to track when characters are fully initialized:

```typescript
const [charactersInitialized, setCharactersInitialized] = useState(false);

// In character initialization
charactersRef.current = characters;
setIsLoaded(true);
setCharactersInitialized(true); // Set flag when done
```

### Fix #2: Guard Message Processing Until Characters Ready

Updated message processing to wait for characters:

```typescript
useEffect(() => {
  if (!charactersInitialized) {
    console.log("[Canvas] Characters not initialized yet, waiting...");
    return; // Exit early
  }

  if (!game.messages || game.messages.length === 0) return;

  const newMessages = game.messages.slice(processedMessageCountRef.current);
  // ... process messages
}, [game.messages, addSpeechBubble, charactersInitialized]); // Added dependency
```

### Fix #3: Fetch Game Status on Phase Changes

Added a fetch when phase changes to "clue" or "discussion" to ensure we have player data:

```typescript
case "phase_change":
  const phaseData = event.data as PhaseChangeEvent;
  setGame((prev) => (prev ? { ...prev, phase: phaseData.phase } : null));
  // Fetch game status on phase change to ensure we have updated player data
  if (phaseData.phase === "clue" || phaseData.phase === "discussion") {
    console.log("[WebSocket] Phase change to active phase - fetching game status");
    fetchGameStatus(gameId);
  }
  break;
```

This ensures that when the game actually starts (phase changes from "setup" to "clue"), we fetch the latest game state which should have players populated.

## Comprehensive Logging Added

Added detailed logging at every stage to diagnose issues:

### WebSocket Events

- Connection opened
- Every event received with type and data
- Message arrivals with player name
- Phase changes
- Game completion

### Character Initialization

- When effect triggers (with player count, status, phase)
- When characters are initialized (with list of names)
- When sprites are loaded per player

### Message Processing

- When effect triggers (total messages, processed count, characters initialized)
- When waiting for characters
- When processing new messages (with list)
- When adding speech bubbles (with delays)

### Speech Bubble Addition

- When called (player name, message preview)
- Available characters list
- When character not found (ERROR)
- Current bubble count

## Expected Behavior Now

1. **Game Creation**:
   - Game is created
   - WebSocket connects
   - "connected" event triggers `fetchGameStatus()`

2. **Phase Change to Active Game**:
   - Backend populates players
   - Phase changes to "clue"
   - `fetchGameStatus()` is called again
   - `game.players` is now populated

3. **Character Initialization**:
   - Canvas detects `game.players` has data
   - Characters are initialized with sprites
   - `charactersInitialized` flag is set to `true`

4. **Message Arrival**:
   - Messages arrive via WebSocket
   - Added to `game.messages` array
   - Message processing effect triggers
   - **NOW** characters are initialized, so processing continues
   - Speech bubbles added with 500ms delays
   - Real-time display works! 🎉

## Testing the Fix

### Console Output to Look For

**Successful Initialization**:

```
[WebSocket] Connection opened
[WebSocket] Event received: connected {...}
[fetchGameStatus] Fetching game status for: xxx
[fetchGameStatus] Received game data: { playerCount: 0, ... }
[Canvas] Players effect triggered: { playerCount: 0, ... }
[Canvas] No players yet, waiting...
[WebSocket] Event received: phase_change { phase: "clue" }
[WebSocket] Phase change to active phase - fetching game status
[fetchGameStatus] Fetching game status for: xxx
[fetchGameStatus] Received game data: { playerCount: 5, ... }
[Canvas] Players effect triggered: { playerCount: 5, ... }
[Canvas] Initializing characters for players: ["Player1", "Player2", ...]
[Canvas] Loading sprites for player 0: Player1
...
[Canvas] Characters initialized: ["Player1", "Player2", ...]
```

**Successful Message Processing**:

```
[WebSocket] Event received: message { player: "Player1", ... }
[WebSocket] Message from Player1: "I think the word is..."
[WebSocket] Updated messages array, total: 1
[Canvas] Messages effect triggered: { totalMessages: 1, processedCount: 0, charactersInitialized: true }
[Canvas] Processing 1 new messages: ["Player1: I think the word is..."]
[Canvas] [Delayed 0ms] Processing message from Player1
[Canvas] addSpeechBubble called for Player1: "I think the word is..."
[Canvas] Characters available: ["Player1", "Player2", ...]
[Canvas] Adding bubble to Player1, current bubbles: 0
```

### Error Scenarios to Watch For

**Characters Not Initialized**:

```
[Canvas] Messages effect triggered: { totalMessages: 5, charactersInitialized: false }
[Canvas] Characters not initialized yet, waiting...
```

This is OKAY - it means we're correctly waiting.

**Character Not Found** (BAD):

```
[Canvas] Character "Player1" not found! Cannot add speech bubble.
```

This should NOT happen anymore if the fix worked.

## Additional Improvements

### Pixel-Art Styling for Model Selector

Updated `ModelSelector.tsx` to match the global pixel-art aesthetic:

- ✅ Sora font
- ✅ 3px black borders on selects
- ✅ Sharp corners (border-radius: 0)
- ✅ Hard shadows on cards
- ✅ Pixel-art button styling
- ✅ Updated "How to Play" section
- ✅ Updated backend info section

## Files Modified

1. `/src/components/mrwhite/MrWhiteCanvas.tsx`
   - Added `charactersInitialized` state
   - Added guard in message processing
   - Added comprehensive logging

2. `/src/hooks/useMrWhite.ts`
   - Added logging to all WebSocket events
   - Added `fetchGameStatus()` on phase change to "clue"/"discussion"
   - Added logging to `fetchGameStatus()`

3. `/src/components/mrwhite/ModelSelector.tsx`
   - Updated to pixel-art styling

4. `/src/app/games/mr-white/page.tsx`
   - Updated "How to Play" section styling
   - Updated backend info styling

## Next Steps

1. **Test the game** and watch console logs
2. **Verify** characters initialize before messages are processed
3. **Confirm** real-time speech bubbles appear
4. **Monitor** for any "Character not found" errors
5. **Profile** performance with many messages

## Success Criteria

✅ Canvas initializes when players are available
✅ Messages wait for characters to be initialized
✅ Speech bubbles appear in real-time (not batched)
✅ 500ms delay between messages
✅ No "Character not found" errors
✅ Console logs show proper flow
✅ Model selector matches pixel-art aesthetic

## Conclusion

The issue was a **race condition** where messages arrived before characters were initialized. By adding:

1. A `charactersInitialized` flag
2. A guard in message processing
3. Additional `fetchGameStatus()` on phase changes
4. Comprehensive logging

We ensure that messages are only processed AFTER characters are ready, enabling true real-time display of speech bubbles on the canvas.

The logging will help diagnose any remaining issues and understand the exact timing of events.
