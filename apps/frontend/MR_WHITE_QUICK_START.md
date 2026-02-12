# Mr. White Canvas - Quick Start Guide

## Running the Application

### 1. Start the Development Server

```bash
cd ai-arena-front
npm run dev
```

The application will be available at `http://localhost:3000`

### 2. Navigate to Mr. White Game

Go to: `http://localhost:3000/games/mr-white`

### 3. Start a Game

1. **Select Models**: Choose 3-10 AI models from the dropdown
   - Mix OpenAI and Mistral models
   - Click "Add" for each model

2. **Click "Start Game"**: The pixel-art button will trigger game creation

3. **Watch the Magic**:
   - Canvas loads with character sprites in a semi-circle
   - Background overlay appears
   - Characters show name tags below them
   - Messages appear as speech bubbles in real-time
   - 500ms delay between each message
   - Bubbles fade out after 5 seconds

## What to Look For

### ✅ Visual Elements

1. **Canvas** (1200x800px)
   - White background
   - 5px black border
   - 8px hard shadow (no blur)
   - Overlay image with 80% opacity

2. **Characters**
   - Positioned in semi-circular arc
   - Directional sprites (bot-left, bot-right)
   - Switch to "face" sprite when speaking
   - Name tags below each character

3. **Speech Bubbles**
   - White background, #333 border
   - Rounded corners (10px radius)
   - Triangular tail on newest bubble
   - Word wrapping at 300px
   - Stack vertically without overlapping
   - Fade out in last 1 second

4. **Info Panels** (below canvas)
   - Game Status card
   - Players list with avatars
   - Vote results (when completed)

### ✅ Real-Time Behavior

- Messages appear one at a time
- 500ms delay between messages
- NO batch rendering at game end
- Smooth fade-out animation
- Characters face forward when speaking

### ✅ Pixel-Art Styling

- Cream background (#FAF6F0)
- Sora font throughout
- Bold, weight 800 headings
- Hard shadows (no blur)
- Sharp corners (border-radius: 0)
- Teal buttons (#4ECDC4)

## Testing Scenarios

### Scenario 1: Minimum Players (3)

```
1. Select 3 models
2. Start game
3. Verify characters positioned in arc
4. Check speech bubbles appear
5. Verify no overlapping
```

### Scenario 2: Maximum Players (10)

```
1. Select 10 models
2. Start game
3. Verify all characters fit in arc
4. Check positioning is balanced
5. Verify speech bubbles work for all
```

### Scenario 3: Real-Time Display

```
1. Start a game
2. Watch messages appear ONE at a time
3. Time the delays (should be ~500ms)
4. Verify bubbles fade after 5 seconds
5. Confirm characters switch to "face" when speaking
```

### Scenario 4: Game Completion

```
1. Let game complete
2. Verify winner banner appears
3. Check vote results display
4. Verify Mr. White is revealed
5. Test "Start New Game" button
```

## Troubleshooting

### Canvas Not Appearing

- Check console for image loading errors
- Verify sprite files exist in `/public/assets/mrwhite/sprites/`
- Verify overlay exists at `/public/assets/mrwhite/overlay.png`

### Speech Bubbles Not Showing

- Check game.messages array in React DevTools
- Verify WebSocket connection in Network tab
- Check console for errors in `addSpeechBubble`

### Characters Not Rendering

- Verify sprite images loaded (check Network tab)
- Check game.players array exists
- Verify sprite paths are correct

### Styling Issues

- Verify `mrwhite-canvas.css` is imported
- Check for CSS conflicts with Tailwind
- Inspect elements to verify classes applied

## Backend Requirements

Make sure the Mr. White backend is running:

```bash
cd ../http-server  # or wherever the backend is
python -m uvicorn main:app --reload --port 8001
```

Environment variable (optional):

```
NEXT_PUBLIC_MRWHITE_API_URL=http://localhost:8001
NEXT_PUBLIC_MRWHITE_WS_URL=ws://localhost:8001
```

## Browser DevTools

### React DevTools

- Check `MrWhiteCanvas` component props
- Verify `game.messages` updates
- Check `charactersRef.current` state

### Console Messages

Look for:

- "Overlay image loaded" or "not found"
- "All character sprites loaded"
- Message processing logs

### Network Tab

- WebSocket connection to `/api/v1/games/{id}/ws`
- Sprite image requests (should be 200)
- Overlay image request (should be 200)

## Expected Performance

- **FPS**: ~60fps (requestAnimationFrame)
- **Message delay**: 500ms between messages
- **Bubble duration**: 5 seconds
- **Fade duration**: 1 second
- **Sprite load time**: <1 second
- **Canvas render time**: <16ms per frame

## Known Issues / Limitations

1. **Fixed canvas size**: Not fully responsive (CSS scales it)
2. **Single overlay**: Can't change overlay during game
3. **No zoom/pan**: Canvas is fixed view
4. **Basic collision**: Simple distance-based detection
5. **No animations**: Static sprites (no movement)

## Next Steps

After verifying the basic functionality works:

1. **Test with different player counts** (3, 5, 7, 10)
2. **Test message timing** (verify 500ms delays)
3. **Test game completion** (verify winner reveal)
4. **Test styling** (verify pixel-art aesthetic)
5. **Test responsiveness** (different screen sizes)
6. **Profile performance** (check FPS, memory usage)

## Success Indicators

✅ Canvas displays with overlay
✅ Characters appear in semi-circle
✅ Name tags show below characters
✅ Speech bubbles appear in real-time
✅ Bubbles fade out after 5 seconds
✅ No overlapping bubbles
✅ Info panels show below canvas
✅ Pixel-art styling throughout
✅ Game completion works
✅ New game button resets

If all indicators are ✅, the implementation is successful!

## Getting Help

If you encounter issues:

1. Check the implementation doc: `MR_WHITE_CANVAS_IMPLEMENTATION.md`
2. Check the UI style guide: `UI-STYLE-GUIDE.md`
3. Check Agora reference: `/agora/static/game.js`
4. Check console for errors
5. Check Network tab for failed requests
6. Use React DevTools to inspect state

## File Locations

```
ai-arena-front/
├── src/
│   ├── components/mrwhite/
│   │   └── MrWhiteCanvas.tsx          (Main canvas component)
│   ├── styles/
│   │   └── mrwhite-canvas.css         (Pixel-art styling)
│   └── app/games/mr-white/
│       └── page.tsx                    (Updated page layout)
└── public/assets/mrwhite/
    ├── sprites/
    │   ├── face.png
    │   ├── bot-left.png
    │   ├── bot-right.png
    │   ├── top-left.png
    │   └── top-right.png
    └── overlay.png
```

Happy testing! 🎮🎭
