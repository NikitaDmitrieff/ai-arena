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
    <div className="pixel-card">
      <h3 className="pixel-heading pixel-heading-sm mb-4">Vote Results</h3>

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
              className={`pixel-panel ${isEliminated ? "pixel-card-red" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="pixel-text" style={{ fontWeight: 700 }}>
                    {player}
                  </span>
                  {isEliminated && (
                    <span className="pixel-badge pixel-badge-danger">
                      Eliminated
                    </span>
                  )}
                </div>
                <span className="pixel-text" style={{ fontWeight: 700 }}>
                  {votes} {votes === 1 ? "vote" : "votes"}
                </span>
              </div>

              {/* Vote Bar */}
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background: "#f9f9f9",
                  border: "3px solid #000",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{
                    height: "100%",
                    background: isEliminated ? "#FF6B6B" : "#4ECDC4",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <p className="pixel-text text-center py-8" style={{ opacity: 0.5 }}>
          No votes yet.
        </p>
      )}
    </div>
  );
}
