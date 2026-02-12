"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCodenames } from "@/hooks/useCodenames";
import { GameBoard } from "@/components/codenames/GameBoard";
import { GameInfo } from "@/components/codenames/GameInfo";
import { GameControls } from "@/components/codenames/GameControls";
import { PlayerConfigForm } from "@/components/codenames/PlayerConfigForm";
import { EventLog } from "@/components/codenames/EventLog";
import { GameStartRequest } from "@/lib/types/codenames";

export default function CodenamesPage() {
  const {
    gameId,
    gameState,
    board,
    lastClue,
    phase,
    currentTeam,
    turnNumber,
    redRemaining,
    blueRemaining,
    winner,
    assassinRevealed,
    isConnected,
    events,
    isLoading,
    error,
    availableModels,
    startGame,
    deleteGame,
    clearError,
    fetchModels,
  } = useCodenames();

  const handleStartGame = async (config: GameStartRequest) => {
    try {
      await startGame(config);
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  const handleNewGame = () => {
    deleteGame();
  };

  const handleDeleteGame = async () => {
    try {
      await deleteGame();
    } catch (err) {
      console.error("Failed to delete game:", err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#FAF6F0" }}>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="pixel-heading pixel-heading-xl mb-4">Codenames AI Arena</h1>
          <p className="pixel-text" style={{ fontSize: "18px" }}>
            Watch AI agents compete in the ultimate word association game
          </p>

          {/* Backend Connection Info */}
          <div className="mt-4 pixel-panel-info inline-block">
            <span className="pixel-text text-sm">
              Backend:{" "}
              <code
                style={{
                  fontSize: "11px",
                  background: "white",
                  padding: "2px 6px",
                  border: "3px solid #000",
                  fontFamily: "monospace",
                }}
              >
                {(process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080") + "/api/codenames"}
              </code>
            </span>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mb-6 pixel-alert pixel-alert-danger"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="pixel-text" style={{ fontWeight: 700 }}>
                      Error
                    </p>
                    <p className="text-sm pixel-text">{error}</p>
                  </div>
                </div>
                <button onClick={clearError} className="pixel-btn pixel-btn-sm pixel-btn-danger">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
          {!gameId ? (
            /* Configuration Form */
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
            <PlayerConfigForm
              availableModels={availableModels}
              onStartGame={handleStartGame}
              isLoading={isLoading}
              onFetchModels={fetchModels}
            />
            </motion.div>
          ) : (
            /* Game View */
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Game Info */}
              <GameInfo
                gameId={gameId}
                phase={phase}
                currentTeam={currentTeam}
                turnNumber={turnNumber}
                redRemaining={redRemaining}
                blueRemaining={blueRemaining}
                winner={winner}
                assassinRevealed={assassinRevealed}
                lastClue={lastClue}
                isConnected={isConnected}
              />

              {/* Game Board */}
              <GameBoard board={board} />

              {/* Game Controls */}
              <GameControls
                gameId={gameId}
                isLoading={isLoading}
                winner={winner}
                onNewGame={handleNewGame}
                onDeleteGame={handleDeleteGame}
              />

              {/* Event Log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto"
              >
                <h2 className="pixel-heading pixel-heading-md mb-4">Game Events</h2>
                <EventLog events={events} maxHeight="500px" />
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Game Rules */}
        {!gameId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-12 pixel-card"
          >
            <h2 className="pixel-heading pixel-heading-md mb-4">How It Works</h2>
            <div className="space-y-3 pixel-text text-sm">
              <p>
                <strong style={{ fontWeight: 800 }}>🎮 Game Setup:</strong> Two teams (Red & Blue)
                compete to identify their words on a 5×5 grid. Each team has a Spymaster (who sees
                which cards belong to which team) and an Operative (who makes guesses).
              </p>
              <p>
                <strong style={{ fontWeight: 800 }}>🔴 Red Team:</strong> The starting team has 9
                cards to reveal.
              </p>
              <p>
                <strong style={{ fontWeight: 800 }}>🔵 Blue Team:</strong> The second team has 8
                cards to reveal.
              </p>
              <p>
                <strong style={{ fontWeight: 800 }}>💭 Gameplay:</strong> Spymasters give one-word
                clues with a number indicating how many words relate to that clue. Operatives make
                guesses based on the clue.
              </p>
              <p>
                <strong style={{ fontWeight: 800 }}>🎯 Winning:</strong> First team to reveal all
                their cards wins. Revealing the 💀 Assassin card causes instant loss.
              </p>
              <p>
                <strong style={{ fontWeight: 800 }}>🤖 AI vs AI:</strong> Watch as AI agents
                strategize, give clues, and make guesses in real-time. Games are fully automated and
                typically take 30-120 seconds.
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 pixel-text text-sm"
          style={{ opacity: 0.7 }}
        >
          <p>Powered by OpenAI and Mistral AI models</p>
          <p className="mt-1">Board: 5×5 grid • 25 cards • 4 AI players</p>
        </motion.div>
      </div>
    </div>
  );
}
