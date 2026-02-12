"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { MoveHistoryWithMetadata } from "@/hooks/useTicTacToe";

interface MoveHistoryProps {
  moves: MoveHistoryWithMetadata[];
}

/**
 * Displays a scrollable log of all moves made in the game
 * Shows player, position, reasoning (if LLM), and response time
 */
export default function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [moves]);

  if (moves.length === 0) {
    return (
      <div className="pixel-card">
        <h3 className="pixel-heading pixel-heading-sm mb-4">📜 Move History</h3>
        <p className="pixel-text text-sm text-center py-8" style={{ opacity: 0.7 }}>
          No moves yet. Start playing to see the history!
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-card">
      <h3 className="pixel-heading pixel-heading-sm mb-4">
        📜 Move History ({moves.length} moves)
      </h3>

      <div ref={scrollRef} className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {[...moves].reverse().map((move, index) => {
          const moveNumber = moves.length - index;
          const isPlayerX = move.player === "X";

          return (
            <motion.div
              key={`move-${moveNumber}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="pixel-panel"
              style={{
                borderLeft: `4px solid ${isPlayerX ? "#FF6B6B" : "#4ECDC4"}`,
                background: isPlayerX ? "#ffebee" : "#e0f7f7",
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className="pixel-text"
                  style={{ fontWeight: 700, color: isPlayerX ? "#FF6B6B" : "#4ECDC4" }}
                >
                  #{moveNumber}: {move.player} → ({move.row}, {move.col})
                </span>
                {move.metadata?.response_time_ms && (
                  <span className="text-xs pixel-text" style={{ opacity: 0.7 }}>
                    {move.metadata.response_time_ms}ms
                  </span>
                )}
              </div>

              {move.reasoning && (
                <p className="text-sm pixel-text italic mt-2">💭 {move.reasoning}</p>
              )}

              {move.metadata?.error && (
                <p className="text-xs pixel-text mt-1" style={{ color: "#FF6B6B" }}>
                  ⚠️ {move.metadata.error}
                </p>
              )}

              {move.metadata?.player_type && (
                <span
                  className={`pixel-badge ${
                    move.metadata.player_type === "llm" ? "pixel-badge-info" : "pixel-badge-success"
                  } mt-2`}
                >
                  {move.metadata.player_type.toUpperCase()}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border: 2px solid #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4ecdc4;
          border: 2px solid #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3fbdb4;
        }
      `}</style>
    </div>
  );
}
