"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const GAMES = ["mr-white"];

export default function Header() {
  const router = useRouter();

  const handlePlayNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const random = GAMES[Math.floor(Math.random() * GAMES.length)];
    router.push(`/games/${random}`);
  };

  return (
    <header className="mb-8">
      <div className="container-padded h-20 flex items-center justify-between bg-white pixel-border-lg shadow-hard">
        <Link href="/" aria-label="LLM Arena Home" className="flex items-center gap-3">
          <Image
            src="/assets/llm-logo.png"
            width={64}
            height={64}
            alt="LLM Arena"
            className="pixel-art"
          />
          <span className="font-sora text-2xl font-bold text-black">LLM Arena</span>
        </Link>
        <nav className="flex items-center gap-6 text-base font-sora">
          <NavLink href="/games">Games</NavLink>
          <NavLink href="/history">History</NavLink>
          <button
            onClick={handlePlayNowClick}
            className="pixel-btn pixel-btn-sm ml-4 hidden sm:inline-block"
          >
            Play now
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-black font-medium hover:text-accent transition-colors"
    >
      {children}
    </Link>
  );
}
