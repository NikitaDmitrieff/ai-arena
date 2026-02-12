"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTicTacToe } from "@/hooks/useTicTacToe";
import GameBoard from "@/components/tictactoe/GameBoard";
import PlayerConfigForm from "@/components/tictactoe/PlayerConfigForm";
import MoveHistory from "@/components/tictactoe/MoveHistory";
import GameControls from "@/components/tictactoe/GameControls";
import GameInfo from "@/components/tictactoe/GameInfo";
import type { PlayerConfig } from "@/lib/types/tictactoe";

/**
 * Tic-Tac-Toe Game Page
 * Main page component that integrates all tic-tac-toe functionality
 */
export default function TicTacToePage() {
  const [showConfig, setShowConfig] = useState(true);
  const {
    gameId,
    gameState,
    playerXInfo,
    playerOInfo,
    moveHistory,
    loading,
    error,
    isPlaying,
    isConnected,
    createGame,
    makeMove,
    playAuto,
    resetGame,
    clearError,
    stopAutoPlay,
  } = useTicTacToe();

  const handleCreateGame = async (playerX: PlayerConfig, playerO: PlayerConfig) => {
    try {
      await createGame({
        player_x: playerX,
        player_o: playerO,
        enable_logging: true,
      });
      setShowConfig(false);
    } catch (err) {
      console.error("Failed to create game:", err);
    }
  };

  const handleNewGame = () => {
    setShowConfig(true);
    clearError();
  };

  const handleMakeMove = async () => {
    try {
      await makeMove();
    } catch (err) {
      console.error("Failed to make move:", err);
    }
  };

  const handlePlayAuto = async () => {
    try {
      await playAuto();
    } catch (err) {
      console.error("Failed during auto-play:", err);
    }
  };

  const handleReset = async () => {
    try {
      await resetGame();
    } catch (err) {
      console.error("Failed to reset game:", err);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#FAF6F0" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="pixel-heading pixel-heading-xl">Tic-Tac-Toe Arena</h1>
          <p className="pixel-text" style={{ fontSize: "18px" }}>
            Watch LLMs battle it out in classic tic-tac-toe, or play yourself!
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
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p>{error}</p>
                </div>
                <button onClick={clearError} className="pixel-btn pixel-btn-sm pixel-btn-danger">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Form */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pixel-card-lg"
            >
              <h2 className="pixel-heading pixel-heading-md text-center mb-6">
                ⚙️ Game Configuration
              </h2>
              <PlayerConfigForm onSubmit={handleCreateGame} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        {!showConfig && gameState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Connection Status */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3"
            >
              <span
                className="h-3 w-3 pixel-border"
                style={{
                  background: isConnected ? "#A8E6CF" : "#FF6B6B",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              <span className="pixel-text text-sm">
                {isConnected ? "Live — WebSocket connected" : "Disconnected"}
              </span>
              {!isConnected && gameId && (
                <button
                  onClick={() => window.location.reload()}
                  className="pixel-btn pixel-btn-sm pixel-btn-warning"
                >
                  Reconnect
                </button>
              )}
            </motion.div>

            {/* Game Controls */}
            <GameControls
              hasGame={!!gameId}
              gameOver={gameState.game_over}
              loading={loading}
              isPlaying={isPlaying}
              onMakeMove={handleMakeMove}
              onPlayAuto={handlePlayAuto}
              onReset={handleReset}
              onNewGame={handleNewGame}
              onStopAutoPlay={stopAutoPlay}
            />

            {/* Loading Indicator */}
            {loading && isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="pixel-panel-info inline-flex items-center gap-3 px-6 py-3">
                  <div className="pixel-spinner" />
                  <span className="pixel-text">Auto-playing — waiting for moves via WebSocket...</span>
                </div>
              </motion.div>
            )}

            {loading && !isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="pixel-panel-info inline-flex items-center gap-3 px-6 py-3">
                  <div className="pixel-spinner" />
                  <span className="pixel-text">Processing...</span>
                </div>
              </motion.div>
            )}

            {/* Main Game Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Board and Info */}
              <div className="space-y-6">
                <GameBoard
                  board={gameState.board}
                  onCellClick={(row, col) => makeMove(row, col)}
                  disabled={loading || isPlaying}
                  gameOver={gameState.game_over}
                />

                <GameInfo
                  gameId={gameId}
                  gameState={gameState}
                  playerXInfo={playerXInfo}
                  playerOInfo={playerOInfo}
                />
              </div>

              {/* Right Column - Move History */}
              <div>
                <MoveHistory moves={moveHistory} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Backend Connection Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pixel-panel-info">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 animate-pulse pixel-border"
                style={{ background: "#A8E6CF" }}
              />
              <span className="pixel-text">
                Connected to backend:{" "}
                <code
                  style={{
                    fontSize: "11px",
                    background: "white",
                    padding: "2px 6px",
                    border: "3px solid #000",
                    fontFamily: "monospace",
                  }}
                >
                  {(process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080") + "/api/tic-tac-toe"}
                </code>
              </span>
            </div>
            <a
              href={
                (process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080") + "/api/tic-tac-toe/docs"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn pixel-btn-sm"
            >
              📖 API Docs
            </a>
          </div>
        </motion.div>

        {/* Features Info */}
        <div className="pixel-grid pixel-grid-3">
          {[
            { icon: "🤖", title: "LLM vs LLM", desc: "Watch AI models battle with reasoning" },
            { icon: "⚡", title: "Real-Time WebSocket", desc: "Live updates as each move happens" },
            { icon: "💭", title: "AI Reasoning", desc: "View LLM decision-making process" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="pixel-card text-center pixel-hover-lift"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="pixel-heading pixel-heading-sm">{item.title}</h3>
              <p className="text-sm pixel-text mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
