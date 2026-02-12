"use client";

import React from "react";
import type { GameState, PlayerInfo } from "@/lib/types/tictactoe";

interface GameInfoProps {
  gameId: string | null;
  gameState: GameState | null;
  playerXInfo: PlayerInfo | null;
  playerOInfo: PlayerInfo | null;
}

/**
 * Displays game information and statistics
 * Shows game ID, player types, current turn, move count
 */
export default function GameInfo({ gameId, gameState, playerXInfo, playerOInfo }: GameInfoProps) {
  if (!gameId || !gameState) {
    return (
      <div className="pixel-card">
        <p className="pixel-text text-center" style={{ opacity: 0.7 }}>
          Configure players and create a game to get started
        </p>
      </div>
    );
  }

  const formatPlayerInfo = (info: PlayerInfo | null) => {
    if (!info) return "Unknown";
    if (info.type === "llm" && info.model) {
      return (
        <span className="flex items-center gap-2">
          {info.model}
          <span className="pixel-badge pixel-badge-info">LLM</span>
        </span>
      );
    }
    return "Random";
  };

  return (
    <div className="pixel-card">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="pixel-text" style={{ fontWeight: 700 }}>
            Game ID:
          </span>
          <p className="text-xs pixel-text font-mono mt-1 truncate" style={{ opacity: 0.7 }}>
            {gameId}
          </p>
        </div>

        <div>
          <span className="pixel-text" style={{ fontWeight: 700 }}>
            Moves Made:
          </span>
          <p className="text-lg pixel-heading mt-1">{gameState.move_history?.length || 0}</p>
        </div>

        <div>
          <span className="pixel-text" style={{ fontWeight: 700, color: "#FF6B6B" }}>
            Player X:
          </span>
          <p className="mt-1 pixel-text">{formatPlayerInfo(playerXInfo)}</p>
        </div>

        <div>
          <span className="pixel-text" style={{ fontWeight: 700, color: "#4ECDC4" }}>
            Player O:
          </span>
          <p className="mt-1 pixel-text">{formatPlayerInfo(playerOInfo)}</p>
        </div>

        <div className="col-span-2">
          <span className="pixel-text" style={{ fontWeight: 700 }}>
            Current Turn:
          </span>
          <p
            className={`text-lg pixel-heading mt-1`}
            style={{ color: gameState.current_player === "X" ? "#FF6B6B" : "#4ECDC4" }}
          >
            {gameState.current_player ? `Player ${gameState.current_player}` : "Game Over"}
          </p>
        </div>

        {gameState.game_over && (
          <div className="col-span-2 mt-2 pixel-panel-info">
            <p className="text-center pixel-heading text-lg">
              {gameState.winner ? (
                <span style={{ color: gameState.winner === "X" ? "#FF6B6B" : "#4ECDC4" }}>
                  🎉 Player {gameState.winner} Wins!
                </span>
              ) : (
                <span>🤝 It's a Draw!</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
