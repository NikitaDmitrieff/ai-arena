"use client";

import { motion } from "framer-motion";
import { BoardCard, CardType } from "@/lib/types/codenames";

interface GameBoardProps {
  board: BoardCard[][] | null;
}

const getCardColor = (cardType: CardType | null, revealed: boolean): React.CSSProperties => {
  if (!revealed) {
    return {
      background: "white",
      border: "3px solid #000",
      boxShadow: "3px 3px 0 rgba(0, 0, 0, 1)",
    };
  }

  const baseStyle = {
    border: "3px solid #000",
    boxShadow: "3px 3px 0 rgba(0, 0, 0, 1)",
  };

  switch (cardType) {
    case "RED":
      return { ...baseStyle, background: "#FF6B6B", color: "#fff" };
    case "BLUE":
      return { ...baseStyle, background: "#4ECDC4", color: "#000" };
    case "NEUTRAL":
      return { ...baseStyle, background: "#FFD93D", color: "#000" };
    case "ASSASSIN":
      return { ...baseStyle, background: "#000", color: "#fff" };
    default:
      return baseStyle;
  }
};

const getCardIcon = (cardType: CardType | null, revealed: boolean): string => {
  if (!revealed) return "❓";

  switch (cardType) {
    case "RED":
      return "🔴";
    case "BLUE":
      return "🔵";
    case "NEUTRAL":
      return "⚪";
    case "ASSASSIN":
      return "💀";
    default:
      return "❓";
  }
};

export function GameBoard({ board }: GameBoardProps) {
  if (!board) {
    return (
      <div className="flex items-center justify-center h-96 pixel-card">
        <p className="pixel-text" style={{ opacity: 0.7 }}>
          Waiting for game to start...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-5 gap-3">
        {board.map((row, rowIndex) =>
          row.map((card, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (rowIndex * 5 + colIndex) * 0.02 }}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                transition: "all 0.5s",
                ...getCardColor(card.card_type, card.revealed),
              }}
            >
              <div className="text-2xl mb-2">{getCardIcon(card.card_type, card.revealed)}</div>
              <div className="text-center px-2">
                <p
                  className="pixel-text"
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(10px, 1vw, 16px)",
                  }}
                >
                  {card.word}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
