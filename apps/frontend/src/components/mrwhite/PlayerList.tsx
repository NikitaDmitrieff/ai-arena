"use client";

import { motion } from "framer-motion";
import { PlayerInfo } from "@/lib/types/mrwhite";

interface PlayerListProps {
  players: PlayerInfo[];
  gameCompleted: boolean;
}

export function PlayerList({ players, gameCompleted }: PlayerListProps) {
  return (
    <div className="pixel-card">
      <h3 className="pixel-heading pixel-heading-sm mb-4">Players</h3>

      <div className="space-y-3">
        {players.map((player, index) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`pixel-panel pixel-hover-lift ${
              gameCompleted && player.is_mister_white
                ? "pixel-card-yellow"
                : gameCompleted && !player.survived
                  ? "pixel-card-red"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Player Info */}
              <div className="flex items-center space-x-3">
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "2px solid #000",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "18px",
                    color: "#fff",
                    background:
                      player.provider === "openai" ? "#4ECDC4" : "#FF6B6B",
                  }}
                >
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="pixel-text" style={{ fontWeight: 700 }}>
                    {player.name}
                  </p>
                  <p className="text-sm pixel-text" style={{ opacity: 0.6 }}>
                    {player.provider} / {player.model}
                  </p>
                  {gameCompleted && player.word && (
                    <p className="text-sm pixel-text mt-1" style={{ opacity: 0.7 }}>
                      Word: <strong>{player.word}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-2">
                {gameCompleted && player.is_mister_white && (
                  <span className="pixel-badge pixel-badge-info">
                    Mister White
                  </span>
                )}
                {gameCompleted && !player.survived && (
                  <span className="pixel-badge pixel-badge-danger">
                    Eliminated
                  </span>
                )}
                {gameCompleted && player.survived && (
                  <span className="pixel-badge pixel-badge-success">
                    Survived
                  </span>
                )}
                {gameCompleted && player.votes_received !== null && (
                  <p className="text-xs pixel-text" style={{ opacity: 0.7 }}>
                    {player.votes_received}{" "}
                    {player.votes_received === 1 ? "vote" : "votes"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {players.length === 0 && (
        <p className="pixel-text text-center py-8" style={{ opacity: 0.5 }}>
          No players yet. Game is starting...
        </p>
      )}
    </div>
  );
}
