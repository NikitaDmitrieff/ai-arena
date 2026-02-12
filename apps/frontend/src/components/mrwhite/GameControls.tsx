"use client";

interface GameControlsProps {
  onNewGame: () => void;
  gameStatus: string | null;
}

export function GameControls({ onNewGame, gameStatus }: GameControlsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onNewGame}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {gameStatus === "completed" || gameStatus === "failed" ? "New Game" : "Start New Game"}
      </button>
    </div>
  );
}
