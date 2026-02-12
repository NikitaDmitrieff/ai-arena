"use client";

import React from "react";

interface GameControlsProps {
  hasGame: boolean;
  gameOver: boolean;
  loading: boolean;
  isPlaying: boolean;
  onMakeMove: () => void;
  onPlayAuto: () => void;
  onReset: () => void;
  onNewGame: () => void;
  onStopAutoPlay: () => void;
}

/**
 * Control buttons for game actions
 * Auto-play is now WebSocket-driven (no delay selector needed)
 */
export default function GameControls({
  hasGame,
  gameOver,
  loading,
  isPlaying,
  onMakeMove,
  onPlayAuto,
  onReset,
  onNewGame,
  onStopAutoPlay,
}: GameControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Make Single Move */}
        <button
          onClick={onMakeMove}
          disabled={!hasGame || gameOver || loading || isPlaying}
          className="pixel-btn"
        >
          🎲 Make Move
        </button>

        {/* Auto Play / Stop */}
        {!isPlaying ? (
          <button
            onClick={onPlayAuto}
            disabled={!hasGame || gameOver || loading}
            className="pixel-btn pixel-btn-success"
          >
            ⚡ Play Auto
          </button>
        ) : (
          <button onClick={onStopAutoPlay} className="pixel-btn pixel-btn-danger animate-pulse">
            ⏸️ Stop Auto
          </button>
        )}

        {/* Reset Game */}
        <button
          onClick={onReset}
          disabled={!hasGame || loading || isPlaying}
          className="pixel-btn pixel-btn-warning"
        >
          🔄 Reset
        </button>

        {/* New Game */}
        <button
          onClick={onNewGame}
          disabled={loading || isPlaying}
          className="pixel-btn pixel-btn-secondary"
        >
          ⚙️ New Config
        </button>
      </div>
    </div>
  );
}
