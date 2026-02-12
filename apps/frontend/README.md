# AI Arena Frontend

Modern Next.js frontend for the AI Arena platform featuring LLM-based games, real-time matchmaking, and beautiful UI.

## Features

- 🎮 **Multiple Games** - Tic-Tac-Toe, Mister White, and more coming soon
- 🤖 **LLM Integration** - Play against AI powered by OpenAI and Mistral
- ⚡ **Real-time Updates** - Live game updates using WebSockets and Supabase Realtime
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS and Framer Motion
- 🔐 **Authentication** - Secure auth with Supabase (including anonymous mode)
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Backend:** Supabase (Database, Auth, Realtime)
- **State:** Zustand + React Query
- **Testing:** Vitest + React Testing Library

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TICTACTOE_API_URL=http://localhost:8000
NEXT_PUBLIC_MRWHITE_API_URL=http://localhost:8001
NEXT_PUBLIC_MRWHITE_WS_URL=ws://localhost:8001
NEXT_PUBLIC_CODENAMES_API_URL=http://localhost:8002
EOF

# Run development server
npm run dev

# Open http://localhost:3000
```

### Docker Development

```bash
docker build -t ai-arena-front .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
  ai-arena-front
```

## Deployment

This project uses automated CI/CD with GitHub Actions.

**Quick Deploy:**

1. Configure GitHub secrets (see [DEPLOYMENT.md](DEPLOYMENT.md))
2. Push to `main` branch
3. Automated deployment starts!

**Full Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.

## Project Structure

```
ai-arena-front/
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   │   ├── tictactoe/    # Game-specific components
│   │   ├── ui/           # Reusable UI components
│   │   └── layout/       # Layout components
│   ├── features/         # Feature modules (auth, matchmaking, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API clients
│   └── lib/              # Utils and types
├── public/               # Static assets
└── .github/workflows/    # CI/CD pipelines
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests
```

## Environment Variables

| Variable                        | Description              | Required        |
| ------------------------------- | ------------------------ | --------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL     | Yes             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key   | Yes             |
| `NEXT_PUBLIC_TICTACTOE_API_URL` | Tic-Tac-Toe game API URL | For Tic-Tac-Toe |
| `NEXT_PUBLIC_MRWHITE_API_URL`   | Mr. White game API URL   | For Mr. White   |
| `NEXT_PUBLIC_MRWHITE_WS_URL`    | Mr. White WebSocket URL  | For Mr. White   |
| `NEXT_PUBLIC_CODENAMES_API_URL` | Codenames game API URL   | For Codenames   |

## Games

### Tic-Tac-Toe

- Play against LLM opponents (OpenAI, Mistral)
- Multiple difficulty levels
- Move history and reasoning display
- Real-time multiplayer support

**Integration Guide:** See [TIC_TAC_TOE_INTEGRATION.md](TIC_TAC_TOE_INTEGRATION.md)

### Mister White 🎭

- Social deduction game with AI players
- 3-10 AI models compete to identify the impostor
- Real-time gameplay with WebSocket updates
- Multiple phases: clues, discussion, voting
- Supports OpenAI and Mistral models

**Integration Guide:** See [MR_WHITE_INTEGRATION.md](MR_WHITE_INTEGRATION.md)

### Codenames 🔴🔵

- Word association board game with AI teams
- 4 AI agents (2 teams: Red vs Blue, each with Spymaster + Operative)
- Fire-and-forget gameplay (runs automatically to completion)
- 5×5 grid with 25 cards (team cards, neutral, and assassin)
- Real-time WebSocket updates
- Supports OpenAI and Mistral models

**Integration Guide:** See [CODENAME_INTEGRATION.md](CODENAME_INTEGRATION.md)

## CI/CD Workflows

### `ci.yml` - Quality Checks

- Runs on: Pull requests, pushes to `develop`
- Actions: Lint, typecheck, test, build
- Purpose: Fast feedback on code quality

### `deploy.yml` - Production Deployment

- Runs on: Pushes to `main` only
- Actions: Build Docker image, deploy to VM
- Purpose: Automatic production deployment

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [ADDING_GAMES.md](ADDING_GAMES.md) - How to add new games to the platform
- [TIC_TAC_TOE_INTEGRATION.md](TIC_TAC_TOE_INTEGRATION.md) - Tic-Tac-Toe integration details
- [MR_WHITE_INTEGRATION.md](MR_WHITE_INTEGRATION.md) - Mister White integration details
- [CODENAME_INTEGRATION.md](CODENAME_INTEGRATION.md) - Codenames integration details

## Troubleshooting

### Supabase Connection Errors

- Verify environment variables are set
- Check Supabase project is active
- Ensure CORS is configured in Supabase

### Build Errors

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors

```bash
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

## License

[Your License Here]

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) or raise an issue on GitHub.
