# Adding a New Game to AI Arena Frontend

This guide outlines the methodology for integrating a new game into the frontend, following the pattern established by Tic-Tac-Toe.

## File Structure Pattern

When adding a new game (e.g., "Chess"), create the following structure:

```
src/
├── app/games/{game-name}/
│   └── page.tsx                    # Main game page component
├── hooks/
│   └── use{GameName}.ts            # Game state management hook
├── services/
│   └── {gamename}Api.ts            # Backend API client
├── lib/types/
│   └── {gamename}.ts               # TypeScript type definitions
└── components/{gamename}/
    ├── GameBoard.tsx               # Board/play area component
    ├── GameControls.tsx            # Control buttons (move, reset, etc.)
    ├── GameInfo.tsx                # Game metadata display
    ├── PlayerConfigForm.tsx        # LLM/player configuration
    └── [other components...]       # Game-specific UI components
```

## Implementation Steps

### 1. Define Types (`src/lib/types/{gamename}.ts`)

Define all TypeScript interfaces matching your backend API:

- `GameConfig` - Game initialization settings
- `GameState` - Current game state
- `PlayerConfig` - Player/LLM configuration
- API response types (`CreateGameResponse`, `MakeMoveResponse`, etc.)
- Game-specific types (moves, metadata, etc.)

### 2. Create API Service (`src/services/{gamename}Api.ts`)

Build a service class with methods for:

- `createGame()` - Initialize new game
- `getGame()` - Fetch current state
- `makeMove()` - Submit player move
- `resetGame()` - Reset to initial state
- `deleteGame()` - Clean up game
- Any game-specific endpoints

Include a custom error class (e.g., `ChessApiError`) for typed error handling.

### 3. Build State Hook (`src/hooks/use{GameName}.ts`)

Create a custom React hook that:

- Manages game state (ID, board state, players, history)
- Wraps API calls with loading/error states
- Provides game action methods (`createGame`, `makeMove`, `resetGame`, etc.)
- Implements auto-play functionality if needed
- Returns typed state and methods

### 4. Create UI Components (`src/components/{gamename}/`)

Build modular components for:

- **GameBoard**: Visual representation of the game state
- **GameControls**: Action buttons (move, auto-play, reset, new game)
- **PlayerConfigForm**: Configure players/LLMs before game start
- **GameInfo**: Display current state, players, winner, etc.
- **MoveHistory/Timeline**: Show move progression (optional)
- Other game-specific visualizations

### 5. Build Page Component (`src/app/games/{game-name}/page.tsx`)

Compose the main page:

- Use the custom hook for state management
- Handle game lifecycle (config → gameplay → result)
- Integrate all UI components
- Add animations with Framer Motion
- Display errors and loading states
- Include backend connection info

## Key Patterns

### Auto-Play Implementation

For real-time move display, implement a loop that:

1. Calls `makeMove()` for single move
2. Updates UI with move result
3. Adds delay for visibility (`setTimeout`)
4. Continues until game over

### Error Handling

- Use custom error classes for typed errors
- Display errors prominently in UI
- Allow users to dismiss errors
- Include error metadata when available

### Configuration Flow

Typical flow: **Config Form → Game Play → Results**

- Show config form initially
- Hide config and show game board after creation
- Provide "New Game" button to return to config

### Environment Variables

#### Local Development

Add backend URL to `.env.local`:

```bash
NEXT_PUBLIC_{GAME}_API_URL=http://localhost:PORT
```

#### How NEXT*PUBLIC*\* Environment Variables Work in Docker

**Critical Understanding**: `NEXT_PUBLIC_*` variables are embedded at **BUILD TIME**, not runtime. Next.js bakes them into the JavaScript bundle during `npm run build`. Once built, the values are hardcoded and cannot be changed.

**The Flow**:

1. Variables are defined as Docker build arguments
2. Next.js embeds them during the build process
3. The compiled JavaScript contains the hardcoded values
4. Runtime environment variables (`docker run -e`) will **NOT** work for `NEXT_PUBLIC_*` vars

#### Required Steps for Docker Deployment

**1. Dockerfile - Define the ARGs and ENVs**

Add these lines before the `npm run build` step:

```dockerfile
# Accept build argument
ARG NEXT_PUBLIC_{GAME}_API_URL

# Set as environment variable for the build
ENV NEXT_PUBLIC_{GAME}_API_URL=$NEXT_PUBLIC_{GAME}_API_URL
```

**2. GitHub Actions - Pass build-args**

In your `.github/workflows/*.yml` file, add the build argument:

```yaml
- name: Build Docker image
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: your-registry/image:tag
    build-args: |
      NEXT_PUBLIC_{GAME}_API_URL=${{ secrets.NEXT_PUBLIC_{GAME}_API_URL }}
```

**3. GitHub Secrets - Store the actual values**

Add the secret in your repository:

- Navigate to: **Settings → Secrets and variables → Actions**
- Click: **New repository secret**
- Name: `NEXT_PUBLIC_{GAME}_API_URL`
- Value: `http://your-production-url:PORT`

**4. Local Docker Build - Pass via CLI**

When building locally with Docker:

```bash
docker build --build-arg NEXT_PUBLIC_{GAME}_API_URL=http://localhost:PORT .
```

Or with docker-compose, add to `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: .
      args:
        NEXT_PUBLIC_{GAME}_API_URL: http://localhost:PORT
```

#### ⚠️ Common Pitfall

Runtime environment variables passed via `docker run -e` or `docker-compose.yml` environment section will **NOT** work for `NEXT_PUBLIC_*` variables because they're already baked into the code during the build step. You must use `build-args` instead.

## Game-Specific Considerations

Each game may require:

- Custom validation logic
- Specific animation/visualization needs
- Unique player types (human, LLM, random, AI)
- Special move representations
- Different board layouts/structures
- Real-time features (for multiplayer)

## Testing

Before completion:

1. Test game creation with various configs
2. Verify move mechanics work correctly
3. Test auto-play functionality
4. Ensure error states display properly
5. Check responsive design
6. Validate backend API connectivity

---

## Reference Implementations

- **Tic-Tac-Toe**: See `src/app/games/tic-tac-toe/` for a turn-based game with human interaction.
- **Mr. White**: See `src/app/games/mr-white/` for a social deduction game with multiple phases.
- **Codenames**: See `src/app/games/codenames/` for a fire-and-forget game with WebSocket real-time updates.
