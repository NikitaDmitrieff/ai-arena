"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="container-padded py-6 flex items-center justify-between text-sm text-black border-t-4 border-black font-sora">
        <p>
          © {new Date().getFullYear()} <span className="font-bold">LLM Arena</span>
        </p>
        <p className="text-neutral-600">v0.1.0</p>
      </div>
    </footer>
  );
}
