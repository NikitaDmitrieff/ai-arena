"use client";

import { motion } from "framer-motion";
import { Team, GamePhase, Clue } from "@/lib/types/codenames";

interface GameInfoProps {
  gameId: string | null;
  phase: GamePhase | null;
  currentTeam: Team | null;
  turnNumber: number;
  redRemaining: number;
  blueRemaining: number;
  winner: Team | null;
  assassinRevealed: boolean;
  lastClue: Clue | null;
  isConnected: boolean;
}

export function GameInfo({
  gameId,
  phase,
  currentTeam,
  turnNumber,
  redRemaining,
  blueRemaining,
  winner,
  assassinRevealed,
  lastClue,
  isConnected,
}: GameInfoProps) {
  const getPhaseDisplay = () => {
    if (!phase) return "Not started";

    switch (phase) {
      case "await_clue":
        return `${currentTeam} Spymaster thinking...`;
      case "await_guess":
        return `${currentTeam} Operative guessing...`;
      case "finished":
        return "Game Over";
      default:
        return phase;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between px-4 py-2 pixel-panel-info">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "8px",
              height: "8px",
              border: "2px solid #000",
              background: isConnected ? "#A8E6CF" : "#FF6B6B",
            }}
            className={isConnected ? "animate-pulse" : ""}
          ></div>
          <span className="text-sm pixel-text">{isConnected ? "Connected" : "Disconnected"}</span>
          {!isConnected && gameId && (
            <button
              onClick={() => window.location.reload()}
              className="pixel-btn pixel-btn-sm pixel-btn-warning"
            >
              Reconnect
            </button>
          )}
        </div>
        {gameId && (
          <span className="text-xs pixel-text font-mono" style={{ opacity: 0.7 }}>
            {gameId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Game Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Turn Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pixel-card"
          style={{ borderColor: "#C7CEEA" }}
        >
          <p className="text-sm pixel-text mb-1" style={{ color: "#C7CEEA", fontWeight: 700 }}>
            Turn
          </p>
          <p className="text-2xl pixel-heading">{turnNumber}</p>
          <p className="text-xs pixel-text mt-1" style={{ opacity: 0.8 }}>
            {getPhaseDisplay()}
          </p>
        </motion.div>

        {/* Red Team Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pixel-card pixel-card-red"
          style={currentTeam === "RED" ? { borderWidth: "4px" } : {}}
        >
          <p className="text-sm pixel-text mb-1" style={{ color: "#FF6B6B", fontWeight: 700 }}>
            🔴 Red Team
          </p>
          <p className="text-2xl pixel-heading">{redRemaining}</p>
          <p className="text-xs pixel-text mt-1" style={{ opacity: 0.8 }}>
            cards remaining
          </p>
        </motion.div>

        {/* Blue Team Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pixel-card pixel-card-blue"
          style={currentTeam === "BLUE" ? { borderWidth: "4px" } : {}}
        >
          <p className="text-sm pixel-text mb-1" style={{ color: "#4ECDC4", fontWeight: 700 }}>
            🔵 Blue Team
          </p>
          <p className="text-2xl pixel-heading">{blueRemaining}</p>
          <p className="text-xs pixel-text mt-1" style={{ opacity: 0.8 }}>
            cards remaining
          </p>
        </motion.div>
      </div>

      {/* Current Clue */}
      {lastClue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pixel-card-lg"
          style={{ borderColor: "#FFD93D" }}
        >
          <p className="text-sm pixel-text mb-2" style={{ color: "#000", fontWeight: 700 }}>
            Current Clue
          </p>
          <div className="flex items-center gap-4">
            <p className="text-3xl pixel-heading uppercase">{lastClue.word}</p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                background: "#FFD93D",
                border: "3px solid #000",
                boxShadow: "3px 3px 0 rgba(0, 0, 0, 1)",
              }}
            >
              <span className="text-2xl pixel-heading">{lastClue.number}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Winner Display */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pixel-card-lg text-center"
          style={{
            borderColor: winner === "RED" ? "#FF6B6B" : "#4ECDC4",
            borderWidth: "4px",
          }}
        >
          <p className="text-4xl pixel-heading mb-2">
            {winner === "RED" ? "🔴" : "🔵"} {winner} TEAM WINS!
          </p>
          {assassinRevealed && (
            <p className="text-lg pixel-text" style={{ opacity: 0.8 }}>
              💀 Assassin was revealed
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
