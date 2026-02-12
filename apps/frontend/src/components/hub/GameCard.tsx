"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export type GameCardProps = {
  id: string;
  title: string;
  description: string;
  tech: "Emulator" | "Server-side" | string;
  image?: string;
  backgroundImage?: string;
};

export default function GameCard({
  id,
  title,
  description,
  tech,
  image = "/assets/logo.svg",
  backgroundImage,
}: GameCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.2 }}
      className="card p-0 relative overflow-hidden group transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg"
    >
      <div className="absolute left-0 top-0 h-2 w-16 bg-pixel-teal group-hover:w-24 transition-all" />
      <Link href={`/games/${id}`} className="block">
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="absolute inset-0 object-cover opacity-10 pointer-events-none select-none"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
        ) : null}
        <div className="aspect-square grid place-items-center p-8 bg-white">
          <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-sora text-4xl font-bold text-black">{title}</h3>
            </div>
            <p className="text-base leading-relaxed text-black font-sora">{description}</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex text-xs font-bold px-3 py-1.5 border-2 border-black bg-pixel-cream text-black font-sora">
                {tech}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
