"use client";

import React, { useState } from "react";

interface GameControlsProps {
  hasGame: boolean;
  gameOver: boolean;
  loading: boolean;
  isPlaying: boolean;
  onMakeMove: () => void;
  onPlayAuto: (delayMs: number) => void;
  onReset: () => void;
  onNewGame: () => void;
  onStopAutoPlay: () => void;
}

/**
 * Control buttons for game actions
 * Make move, auto-play, reset, new game, etc.
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
  const [moveDelay, setMoveDelay] = useState(1000);

  const handlePlayAuto = () => {
    onPlayAuto(moveDelay);
  };

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
            onClick={handlePlayAuto}
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

      {/* Delay Control */}
      {hasGame && !gameOver && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <label htmlFor="moveDelay" className="pixel-text">
            ⏱️ Move Delay:
          </label>
          <select
            id="moveDelay"
            value={moveDelay}
            onChange={(e) => setMoveDelay(Number(e.target.value))}
            disabled={isPlaying}
            className="pixel-select"
            style={{ width: "auto" }}
          >
            <option value={500}>0.5s (Fast)</option>
            <option value={1000}>1s (Normal)</option>
            <option value={1500}>1.5s</option>
            <option value={2000}>2s</option>
            <option value={3000}>3s (Slow)</option>
          </select>
        </div>
      )}
    </div>
  );
}
