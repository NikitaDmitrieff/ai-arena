"use client";

import { GameResponse } from "@/lib/types/mrwhite";

interface GameInfoProps {
  game: GameResponse;
  isConnected: boolean;
}

const statusColors = {
  pending: "bg-yellow-500",
  running: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const phaseColors = {
  setup: "bg-blue-500",
  clue: "bg-green-500",
  discussion: "bg-yellow-500",
  voting: "bg-red-500",
  results: "bg-purple-500",
};

export function GameInfo({ game, isConnected }: GameInfoProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side - Status and Phase */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[game.status]} animate-pulse`} />
            <span className="text-white font-medium capitalize">{game.status}</span>
          </div>

          {/* Phase Badge */}
          {game.phase && (
            <div
              className={`${phaseColors[game.phase]} px-3 py-1 rounded-full text-white text-sm font-medium capitalize`}
            >
              {game.phase}
            </div>
          )}

          {/* Connection Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-zinc-400 text-sm">{isConnected ? "Live" : "Disconnected"}</span>
          </div>
        </div>

        {/* Right side - Game Info */}
        <div className="flex flex-col md:items-end gap-1">
          <p className="text-zinc-400 text-sm">
            Game ID: <span className="text-white font-mono">{game.game_id.slice(0, 8)}...</span>
          </p>
          <p className="text-zinc-400 text-sm">
            Players: <span className="text-white">{game.players?.length || 0}</span>
          </p>
          <p className="text-zinc-400 text-sm">
            Created:{" "}
            <span className="text-white">{new Date(game.created_at).toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Game Results (if completed) */}
      {game.status === "completed" && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm mb-1">Winner</p>
              <p className="text-white text-lg font-semibold capitalize">
                {game.winner_side === "mister_white" ? "🎭 Mister White" : "👥 Citizens"}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm mb-1">Secret Word</p>
              <p className="text-white text-lg font-semibold">{game.secret_word}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm mb-1">Mister White</p>
              <p className="text-white text-lg font-semibold">{game.mister_white_player}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm mb-1">Eliminated</p>
              <p className="text-white text-lg font-semibold">{game.eliminated_player}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {game.error && (
        <div className="mt-4 bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            <span className="font-semibold">Error:</span> {game.error}
          </p>
        </div>
      )}
    </div>
  );
}
