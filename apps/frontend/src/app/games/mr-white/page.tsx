"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMrWhite } from "@/hooks/useMrWhite";
import { ModelConfig } from "@/lib/types/mrwhite";
import { ModelSelector } from "@/components/mrwhite/ModelSelector";
import { GameInfo } from "@/components/mrwhite/GameInfo";
import { PlayerList } from "@/components/mrwhite/PlayerList";
import { MessageFeed } from "@/components/mrwhite/MessageFeed";
import { VoteResults } from "@/components/mrwhite/VoteResults";
import { GameControls } from "@/components/mrwhite/GameControls";
import { MrWhiteCanvas } from "@/components/mrwhite/MrWhiteCanvas";
import "@/styles/mrwhite-canvas.css";

export default function MrWhitePage() {
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [showConfig, setShowConfig] = useState(true);

  const { game, isConnected, isLoading, error, createGame, clearError } = useMrWhite();

  const handleStartGame = async () => {
    if (selectedModels.length < 3) {
      return;
    }

    await createGame({ models: selectedModels });
    setShowConfig(false);
  };

  const handleNewGame = () => {
    setShowConfig(true);
    setSelectedModels([]);
    // Reset the game state by clearing it
    window.location.reload();
  };

  const canStartGame = selectedModels.length >= 3 && selectedModels.length <= 10;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#FAF6F0" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <h1
            className="text-5xl font-bold"
            style={{
              fontWeight: 800,
              fontSize: "48px",
              color: "#000",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            🎭 Mister White
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#000", fontWeight: 600 }}>
            A social deduction game where AI models compete to identify the impostor
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <p className="text-red-700">{error}</p>
                </div>
                <button onClick={clearError} className="text-red-500 hover:text-red-700 font-bold">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {showConfig && !game ? (
            // Configuration Screen
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <ModelSelector
                selectedModels={selectedModels}
                onModelsChange={setSelectedModels}
                minModels={3}
                maxModels={10}
              />

              {/* Game Rules */}
              <div className="mrwhite-panel-card mt-6">
                <h3 style={{ fontSize: "20px", fontWeight: 800 }}>📖 How to Play</h3>
                <div className="space-y-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                  <p>
                    • One player is secretly assigned as{" "}
                    <strong style={{ color: "#C7CEEA", background: "#000", padding: "2px 6px" }}>
                      🎭 Mister White
                    </strong>
                  </p>
                  <p>
                    • All other players are{" "}
                    <strong style={{ color: "#A8E6CF", background: "#000", padding: "2px 6px" }}>
                      👥 Citizens
                    </strong>{" "}
                    who know the secret word
                  </p>
                  <p>• Players give clues about the word without being too obvious</p>
                  <p>
                    • After discussion, players vote to eliminate who they think is Mister White
                  </p>
                  <p>
                    • <strong>Citizens win</strong> if Mister White is eliminated
                  </p>
                  <p>
                    • <strong>Mister White wins</strong> if a Citizen is eliminated
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <div className="mt-6">
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame || isLoading}
                  className="w-full mrwhite-btn"
                  style={{
                    opacity: !canStartGame || isLoading ? 0.5 : 1,
                    cursor: !canStartGame || isLoading ? "not-allowed" : "pointer",
                    padding: "16px 24px",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Starting Game...
                    </span>
                  ) : (
                    `🎮 Start Game${!canStartGame ? " (Select 3-10 Players)" : ""}`
                  )}
                </button>
              </div>

              {/* Backend Info */}
              <div
                className="mt-6"
                style={{
                  background: "#FFF9E6",
                  border: "3px solid #000",
                  padding: "12px",
                  boxShadow: "3px 3px 0 rgba(0, 0, 0, 1)",
                }}
              >
                <div
                  className="flex items-center justify-center gap-2 text-sm"
                  style={{ fontWeight: 600 }}
                >
                  <span
                    className="h-3 w-3 animate-pulse"
                    style={{
                      background: "#A8E6CF",
                      border: "2px solid #000",
                    }}
                  />
                  <span style={{ color: "#000" }}>
                    Connected to backend:{" "}
                    <code
                      style={{
                        fontSize: "11px",
                        background: "white",
                        padding: "2px 6px",
                        border: "2px solid #000",
                        fontFamily: "monospace",
                      }}
                    >
                      {process.env["NEXT_PUBLIC_MRWHITE_API_URL"] || "http://localhost:8001"}
                    </code>
                  </span>
                </div>
              </div>
            </motion.div>
          ) : game ? (
            // Game Screen with Canvas
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mrwhite-canvas-container"
            >
              {/* Canvas at Top */}
              <MrWhiteCanvas game={game} />

              {/* Game Controls */}
              {(game.status === "completed" || game.status === "failed") && (
                <div className="text-center mb-6">
                  <button onClick={handleNewGame} className="mrwhite-btn">
                    🎮 Start New Game
                  </button>
                </div>
              )}

              {/* Completed Game - Winner Announcement */}
              {game.status === "completed" && (
                <div className="mrwhite-winner-banner">
                  <h2>🎉 Game Complete!</h2>
                  <p>
                    Winner:{" "}
                    <strong>
                      {game.winner_side === "mister_white" ? "🎭 Mister White" : "👥 Citizens"}
                    </strong>
                  </p>
                  <p>
                    The secret word was: <strong>{game.secret_word}</strong>
                  </p>
                </div>
              )}

              {/* Info Panel Below Canvas */}
              <div className="mrwhite-info-panel">
                {/* Game Status Info */}
                <div className="mrwhite-panel-card">
                  <h3>📊 Game Status</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong> <span className="capitalize">{game.status}</span>
                    </p>
                    <p>
                      <strong>Phase:</strong>{" "}
                      <span className="capitalize">{game.phase || "N/A"}</span>
                    </p>
                    <p>
                      <strong>Players:</strong> {game.players?.length || 0}
                    </p>
                    <p>
                      <strong>Connected:</strong>{" "}
                      <span className={isConnected ? "text-green-600" : "text-red-600"}>
                        {isConnected ? "✓ Yes" : "✗ No"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Players List */}
                {game.players && game.players.length > 0 && (
                  <div className="mrwhite-panel-card">
                    <h3>👥 Players</h3>
                    <div className="space-y-2">
                      {game.players.map((player) => (
                        <div key={player.name} className="mrwhite-player-item">
                          <div className="mrwhite-player-info">
                            <div className={`mrwhite-player-avatar ${player.provider}`}>
                              {player.name.charAt(0)}
                            </div>
                            <div>
                              <div className="mrwhite-player-name">{player.name}</div>
                              <div className="mrwhite-player-model">
                                {player.provider} / {player.model}
                              </div>
                            </div>
                          </div>
                          {game.status === "completed" && (
                            <div className="flex flex-col gap-1">
                              {player.is_mister_white && (
                                <span className="mrwhite-badge mister-white">🎭 Mr. White</span>
                              )}
                              {player.survived !== null && (
                                <span
                                  className={`mrwhite-badge ${player.survived ? "survived" : "eliminated"}`}
                                >
                                  {player.survived ? "✓ Survived" : "✗ Eliminated"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote Results */}
                {game.status === "completed" && game.vote_counts && (
                  <div className="mrwhite-panel-card">
                    <h3>🗳️ Vote Results</h3>
                    <div className="space-y-2">
                      {Object.entries(game.vote_counts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([player, votes]) => (
                          <div key={player} className="mrwhite-vote-item">
                            <span>
                              <strong>{player}</strong>
                              {player === game.eliminated_player && " (Eliminated)"}
                            </span>
                            <span>{votes} votes</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {!game.messages && game.status === "running" && (
                <div className="mrwhite-game-info">
                  <p>⏳ Game is starting... Players are thinking...</p>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
