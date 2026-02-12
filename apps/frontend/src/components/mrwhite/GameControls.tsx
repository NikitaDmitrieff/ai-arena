"use client";

interface GameControlsProps {
  onNewGame: () => void;
  gameStatus: string | null;
}

export function GameControls({ onNewGame, gameStatus }: GameControlsProps) {
  return (
    <div className="flex gap-4">
      <button onClick={onNewGame} className="flex-1 pixel-btn pixel-btn-lg">
        {gameStatus === "completed" || gameStatus === "failed"
          ? "New Game"
          : "Start New Game"}
      </button>
    </div>
  );
}
