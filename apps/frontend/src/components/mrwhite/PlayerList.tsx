"use client";

import { motion } from "framer-motion";
import { PlayerInfo } from "@/lib/types/mrwhite";

interface PlayerListProps {
  players: PlayerInfo[];
  gameCompleted: boolean;
}

export function PlayerList({ players, gameCompleted }: PlayerListProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Players</h3>

      <div className="space-y-3">
        {players.map((player, index) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-zinc-800 border rounded-lg p-4 ${
              gameCompleted && player.is_mister_white
                ? "border-purple-500"
                : gameCompleted && !player.survived
                  ? "border-red-500"
                  : "border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Player Info */}
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    player.provider === "openai" ? "bg-green-600" : "bg-orange-600"
                  }`}
                >
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-semibold">{player.name}</p>
                  <p className="text-sm text-zinc-400">
                    {player.provider} / {player.model}
                  </p>
                  {gameCompleted && player.word && (
                    <p className="text-sm text-zinc-500 mt-1">
                      Word: <span className="text-zinc-300">{player.word}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-2">
                {gameCompleted && player.is_mister_white && (
                  <div className="bg-purple-600 px-3 py-1 rounded-full text-white text-xs font-medium">
                    🎭 Mister White
                  </div>
                )}
                {gameCompleted && !player.survived && (
                  <div className="bg-red-600 px-3 py-1 rounded-full text-white text-xs font-medium">
                    ❌ Eliminated
                  </div>
                )}
                {gameCompleted && player.survived && (
                  <div className="bg-green-600 px-3 py-1 rounded-full text-white text-xs font-medium">
                    ✓ Survived
                  </div>
                )}
                {gameCompleted && player.votes_received !== null && (
                  <p className="text-xs text-zinc-400">
                    {player.votes_received} {player.votes_received === 1 ? "vote" : "votes"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {players.length === 0 && (
        <p className="text-zinc-500 text-center py-8">No players yet. Game is starting...</p>
      )}
    </div>
  );
}
