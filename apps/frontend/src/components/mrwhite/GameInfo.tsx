"use client";

import { GameResponse } from "@/lib/types/mrwhite";

interface GameInfoProps {
  game: GameResponse;
  isConnected: boolean;
}

const statusBadge: Record<string, string> = {
  pending: "pixel-badge pixel-badge-warning",
  running: "pixel-badge pixel-badge-primary",
  completed: "pixel-badge pixel-badge-success",
  failed: "pixel-badge pixel-badge-danger",
};

const phaseBadge: Record<string, string> = {
  setup: "pixel-badge pixel-badge-info",
  clue: "pixel-badge pixel-badge-success",
  discussion: "pixel-badge pixel-badge-warning",
  voting: "pixel-badge pixel-badge-danger",
  results: "pixel-badge pixel-badge-info",
};

export function GameInfo({ game, isConnected }: GameInfoProps) {
  return (
    <div className="pixel-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side - Status and Phase */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={statusBadge[game.status] || "pixel-badge"}>
            {game.status}
          </span>

          {game.phase && (
            <span className={phaseBadge[game.phase] || "pixel-badge"}>
              {game.phase}
            </span>
          )}

          {/* Connection Indicator */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "8px",
                height: "8px",
                border: "2px solid #000",
                background: isConnected ? "#A8E6CF" : "#FF6B6B",
              }}
              className={isConnected ? "animate-pulse" : ""}
            />
            <span className="text-sm pixel-text">
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Right side - Game Info */}
        <div className="flex flex-col md:items-end gap-1">
          <p className="text-sm pixel-text">
            Game ID:{" "}
            <span className="font-mono" style={{ opacity: 0.7 }}>
              {game.game_id.slice(0, 8)}...
            </span>
          </p>
          <p className="text-sm pixel-text">
            Players: <strong>{game.players?.length || 0}</strong>
          </p>
          <p className="text-sm pixel-text">
            Created:{" "}
            <span style={{ opacity: 0.7 }}>
              {new Date(game.created_at).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Game Results (if completed) */}
      {game.status === "completed" && (
        <div className="mt-6 pt-6" style={{ borderTop: "3px solid #000" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pixel-panel">
              <p className="text-sm pixel-text mb-1" style={{ opacity: 0.7 }}>
                Winner
              </p>
              <p className="text-lg pixel-heading">
                {game.winner_side === "mister_white"
                  ? "Mister White"
                  : "Citizens"}
              </p>
            </div>
            <div className="pixel-panel">
              <p className="text-sm pixel-text mb-1" style={{ opacity: 0.7 }}>
                Secret Word
              </p>
              <p className="text-lg pixel-heading">{game.secret_word}</p>
            </div>
            <div className="pixel-panel">
              <p className="text-sm pixel-text mb-1" style={{ opacity: 0.7 }}>
                Mister White
              </p>
              <p className="text-lg pixel-heading">
                {game.mister_white_player}
              </p>
            </div>
            <div className="pixel-panel">
              <p className="text-sm pixel-text mb-1" style={{ opacity: 0.7 }}>
                Eliminated
              </p>
              <p className="text-lg pixel-heading">
                {game.eliminated_player}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {game.error && (
        <div className="mt-4 pixel-alert pixel-alert-danger">
          <p className="text-sm pixel-text">
            <strong>Error:</strong> {game.error}
          </p>
        </div>
      )}
    </div>
  );
}
