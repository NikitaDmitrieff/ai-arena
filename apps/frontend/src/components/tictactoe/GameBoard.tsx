"use client";

import React from "react";
import { motion } from "framer-motion";

interface GameBoardProps {
  board: (string | null)[][];
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  gameOver?: boolean;
}

/**
 * Tic-Tac-Toe game board component
 * Displays 3x3 grid with X and O marks
 */
export default function GameBoard({
  board,
  onCellClick,
  disabled = false,
  gameOver = false,
}: GameBoardProps) {
  const handleCellClick = (row: number, col: number) => {
    if (disabled || gameOver || board[row]?.[col] !== null) return;
    onCellClick?.(row, col);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-3 p-6 pixel-card">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const isEmpty = cell === null;
            const isClickable = !disabled && !gameOver && isEmpty;

            return (
              <motion.button
                key={cellKey}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={!isClickable}
                whileHover={isClickable ? { x: -2, y: -2 } : {}}
                whileTap={isClickable ? { x: 2, y: 2 } : {}}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #000",
                  borderRadius: 0,
                  background: "white",
                  fontSize: "48px",
                  fontWeight: "bold",
                  boxShadow: isEmpty ? "3px 3px 0 rgba(0, 0, 0, 1)" : "3px 3px 0 rgba(0, 0, 0, 1)",
                  cursor: isClickable ? "pointer" : "not-allowed",
                  color: cell === "X" ? "#FF6B6B" : cell === "O" ? "#4ECDC4" : "#000",
                  transition: "all 0.2s ease",
                }}
                className={isClickable ? "pixel-hover-lift" : ""}
              >
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
