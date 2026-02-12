"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function StartRandomButton({ gameIds }: { gameIds: string[] }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/games");
  };

  return (
    <button
      onClick={handleClick}
      className="pixel-btn pixel-btn-lg inline-flex items-center gap-3"
    >
      <span>Start playing now!</span>
    </button>
  );
}
