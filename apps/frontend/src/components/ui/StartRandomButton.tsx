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
      className="btn-reset inline-flex items-center gap-3 px-8 py-4 text-lg font-bold font-sora text-black bg-pixel-teal border-3 border-black shadow-hard hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-hard-active active:translate-x-0.5 active:translate-y-0.5 transition-all duration-200 ease-in-out hover:bg-accent-hover"
    >
      <span>Start playing now!</span>
    </button>
  );
}
