"use client";

import { motion } from "framer-motion";

interface VoteResultsProps {
  voteCount: Record<string, number>;
  eliminatedPlayer: string | null;
}

export function VoteResults({ voteCount, eliminatedPlayer }: VoteResultsProps) {
  const entries = Object.entries(voteCount).sort((a, b) => b[1] - a[1]);
  const maxVotes = Math.max(...entries.map(([_, votes]) => votes));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Vote Results</h3>

      <div className="space-y-3">
        {entries.map(([player, votes], index) => {
          const percentage = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
          const isEliminated = player === eliminatedPlayer;

          return (
            <motion.div
              key={player}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-zinc-800 rounded-lg p-4 ${
                isEliminated ? "border-2 border-red-500" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{player}</span>
                  {isEliminated && (
                    <span className="bg-red-600 px-2 py-1 rounded text-white text-xs font-medium">
                      Eliminated
                    </span>
                  )}
                </div>
                <span className="text-white font-bold">
                  {votes} {votes === 1 ? "vote" : "votes"}
                </span>
              </div>

              {/* Vote Bar */}
              <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full ${isEliminated ? "bg-red-500" : "bg-blue-500"}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && <p className="text-zinc-500 text-center py-8">No votes yet.</p>}
    </div>
  );
}
