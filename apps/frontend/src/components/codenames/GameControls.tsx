"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface GameControlsProps {
  gameId: string | null;
  isLoading: boolean;
  winner: string | null;
  onNewGame: () => void;
  onDeleteGame: () => void;
}

export function GameControls({
  gameId,
  isLoading,
  winner,
  onNewGame,
  onDeleteGame,
}: GameControlsProps) {
  if (!gameId) {
    return (
      <p className="text-center pixel-text text-sm" style={{ opacity: 0.7 }}>
        Configure agents and start a game
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto flex flex-wrap gap-4 justify-center"
    >
      <button onClick={onNewGame} disabled={isLoading} className="pixel-btn pixel-btn-success">
        {winner ? "Play Again" : "New Game"}
      </button>

      <button onClick={onDeleteGame} disabled={isLoading} className="pixel-btn pixel-btn-danger">
        {winner ? "Close Game" : "Cancel Game"}
      </button>
    </motion.div>
  );
}
