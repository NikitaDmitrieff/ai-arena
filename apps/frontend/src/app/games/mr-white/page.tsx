"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMrWhite } from "@/hooks/useMrWhite";
import { ModelConfig } from "@/lib/types/mrwhite";
import { ModelSelector } from "@/components/mrwhite/ModelSelector";
import { MrWhiteCanvas } from "@/components/mrwhite/MrWhiteCanvas";
import "@/styles/mrwhite-canvas.css";

export default function MrWhitePage() {
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [showConfig, setShowConfig] = useState(true);

  const { game, isConnected, isLoading, error, createGame, clearError } = useMrWhite();

  const handleStartGame = async () => {
    if (selectedModels.length < 3) return;
    await createGame({ models: selectedModels });
    setShowConfig(false);
  };

  const handleNewGame = () => {
    setShowConfig(true);
    setSelectedModels([]);
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
        >
          <h1 className="pixel-heading pixel-heading-xl">Mister White</h1>
          <p className="pixel-text text-lg max-w-2xl mx-auto">
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
              className="pixel-alert pixel-alert-danger"
            >
              <div className="flex items-center justify-between">
                <p className="pixel-text">{error}</p>
                <button onClick={clearError} className="pixel-btn pixel-btn-danger pixel-btn-sm">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {showConfig && !game ? (
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
              <div className="pixel-card mt-6">
                <h3 className="pixel-heading pixel-heading-sm mb-4">How to Play</h3>
                <div className="space-y-2 pixel-text text-sm">
                  <p>
                    One player is secretly assigned as{" "}
                    <span className="pixel-badge pixel-badge-info">Mister White</span>
                  </p>
                  <p>
                    All other players are{" "}
                    <span className="pixel-badge pixel-badge-success">Citizens</span>{" "}
                    who know the secret word
                  </p>
                  <p>Players give clues about the word without being too obvious</p>
                  <p>After discussion, players vote to eliminate who they think is Mister White</p>
                  <p>
                    <strong>Citizens win</strong> if Mister White is eliminated
                  </p>
                  <p>
                    <strong>Mister White wins</strong> if a Citizen is eliminated
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <div className="mt-6">
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame || isLoading}
                  className="w-full pixel-btn pixel-btn-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="pixel-spinner" />
                      Starting Game...
                    </span>
                  ) : (
                    `Start Game${!canStartGame ? " (Select 3-10 Players)" : ""}`
                  )}
                </button>
              </div>

              {/* Backend Info */}
              <div className="mt-6 pixel-panel-info">
                <div className="flex items-center justify-center gap-2 text-sm pixel-text">
                  <span
                    className="animate-pulse"
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "#A8E6CF",
                      border: "2px solid #000",
                      display: "inline-block",
                    }}
                  />
                  <span>
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
                      {(process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080") +
                        "/api/mr-white"}
                    </code>
                  </span>
                </div>
              </div>
            </motion.div>
          ) : game ? (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Canvas at Top */}
              <MrWhiteCanvas game={game} />

              {/* Game Controls */}
              {(game.status === "completed" || game.status === "failed") && (
                <div className="text-center mb-6">
                  <button onClick={handleNewGame} className="pixel-btn pixel-btn-lg">
                    Start New Game
                  </button>
                </div>
              )}

              {/* Winner Announcement */}
              {game.status === "completed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pixel-card-lg text-center my-8 mx-auto max-w-3xl"
                  style={{
                    borderColor: "#FFD93D",
                    borderWidth: "4px",
                    background: "#FFD93D",
                  }}
                >
                  <p className="pixel-heading pixel-heading-lg mb-2">Game Complete!</p>
                  <p className="pixel-text text-xl">
                    Winner:{" "}
                    <strong>
                      {game.winner_side === "mister_white" ? "Mister White" : "Citizens"}
                    </strong>
                  </p>
                  <p className="pixel-text text-lg mt-2">
                    The secret word was: <strong>{game.secret_word}</strong>
                  </p>
                </motion.div>
              )}

              {/* Info Panel Below Canvas */}
              <div className="pixel-container">
                <div className="pixel-grid pixel-grid-2">
                  {/* Game Status Info */}
                  <div className="pixel-card">
                    <h3 className="pixel-heading pixel-heading-sm mb-4">Game Status</h3>
                    <div className="space-y-3 pixel-text">
                      <div className="flex items-center justify-between">
                        <span style={{ fontWeight: 700 }}>Status:</span>
                        <span className={`pixel-badge ${
                          game.status === "running" ? "pixel-badge-primary" :
                          game.status === "completed" ? "pixel-badge-success" :
                          game.status === "failed" ? "pixel-badge-danger" :
                          "pixel-badge-warning"
                        }`}>
                          {game.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontWeight: 700 }}>Phase:</span>
                        <span className="capitalize">{game.phase || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontWeight: 700 }}>Players:</span>
                        <span>{game.players?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontWeight: 700 }}>Connected:</span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              border: "2px solid #000",
                              background: isConnected ? "#A8E6CF" : "#FF6B6B",
                              display: "inline-block",
                            }}
                          />
                          {isConnected ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Players List */}
                  {game.players && game.players.length > 0 && (
                    <div className="pixel-card">
                      <h3 className="pixel-heading pixel-heading-sm mb-4">Players</h3>
                      <div className="space-y-2">
                        {game.players.map((player) => (
                          <div key={player.name} className="pixel-panel flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  border: "2px solid #000",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                  color: "#fff",
                                  background: player.provider === "openai" ? "#4ECDC4" : "#FF6B6B",
                                }}
                              >
                                {player.name.charAt(0)}
                              </div>
                              <div>
                                <div className="pixel-text text-sm" style={{ fontWeight: 700 }}>
                                  {player.name}
                                </div>
                                <div className="pixel-text text-xs" style={{ opacity: 0.6 }}>
                                  {player.provider} / {player.model}
                                </div>
                              </div>
                            </div>
                            {game.status === "completed" && (
                              <div className="flex flex-col gap-1">
                                {player.is_mister_white && (
                                  <span className="pixel-badge pixel-badge-info">Mr. White</span>
                                )}
                                {player.survived !== null && (
                                  <span
                                    className={`pixel-badge ${
                                      player.survived ? "pixel-badge-success" : "pixel-badge-danger"
                                    }`}
                                  >
                                    {player.survived ? "Survived" : "Eliminated"}
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
                    <div className="pixel-card">
                      <h3 className="pixel-heading pixel-heading-sm mb-4">Vote Results</h3>
                      <div className="space-y-2">
                        {Object.entries(game.vote_counts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([player, votes]) => (
                            <div
                              key={player}
                              className={`pixel-panel flex items-center justify-between ${
                                player === game.eliminated_player ? "pixel-card-red" : ""
                              }`}
                            >
                              <span className="pixel-text" style={{ fontWeight: 700 }}>
                                {player}
                                {player === game.eliminated_player && (
                                  <span className="pixel-badge pixel-badge-danger ml-2">
                                    Eliminated
                                  </span>
                                )}
                              </span>
                              <span className="pixel-text" style={{ fontWeight: 700 }}>
                                {votes} votes
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {!game.messages && game.status === "running" && (
                <div className="pixel-alert pixel-alert-info text-center mt-6 mx-auto max-w-3xl">
                  <div className="flex items-center justify-center gap-3">
                    <span className="pixel-spinner" />
                    <p className="pixel-text">Game is starting... Players are thinking...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
