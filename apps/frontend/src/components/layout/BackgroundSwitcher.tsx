"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import LoopBackground from '@/components/layout/LoopBackground';

export default function BackgroundSwitcher() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  if (isHome) {
    return <LoopBackground />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_10%_-10%,rgba(57,255,20,0.12),transparent),radial-gradient(700px_260px_at_90%_0%,rgba(0,0,0,0.06),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/70" />
    </div>
  );
}


