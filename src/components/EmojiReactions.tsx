"use client";

import React, { useState, useEffect } from "react";

interface EmojiReactionsProps {
  articleId: string;
}

interface Reaction {
  key: string;
  emoji: string;
  label: string;
  count: number;
  color: string;
}

export default function EmojiReactions({ articleId }: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [hasVoted, setHasVoted] = useState<string | null>(null);

  useEffect(() => {
    // Generate initial stable reaction counts based on articleId
    const seed = articleId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    setReactions([
      { key: "fire", emoji: "🔥", label: "Gbona / Fire", count: (seed % 150) + 45, color: "bg-orange-500" },
      { key: "shock", emoji: "😮", label: "Opor / Shock", count: (seed % 80) + 12, color: "bg-yellow-500" },
      { key: "pride", emoji: "🇳🇬", label: "Naija Pride", count: (seed % 200) + 68, color: "bg-flag" },
      { key: "wahala", emoji: "😡", label: "Wahala", count: (seed % 100) + 33, color: "bg-signal" },
    ]);

    // Check if voted in localStorage
    const savedVote = localStorage.getItem(`reaction_vote_${articleId}`);
    if (savedVote) {
      setHasVoted(savedVote);
    }
  }, [articleId]);

  const handleVote = (key: string) => {
    if (hasVoted) return; // Prevent double voting

    setReactions((prev) =>
      prev.map((r) => (r.key === key ? { ...r, count: r.count + 1 } : r))
    );
    setHasVoted(key);
    localStorage.setItem(`reaction_vote_${articleId}`, key);
  };

  const totalVotes = reactions.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <div className="bg-paper border-2 border-ink p-5 rounded my-8 font-body shadow-sm">
      <h4 className="font-display font-black text-sm uppercase tracking-wider text-ink border-b-2 border-ink/10 pb-2 mb-4">
        Wetins Your Reaction to This Story?
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {reactions.map((r) => {
          const percentage = Math.round((r.count / totalVotes) * 100);
          const isSelected = hasVoted === r.key;

          return (
            <button
              key={r.key}
              onClick={() => handleVote(r.key)}
              disabled={hasVoted !== null}
              className={`flex flex-col items-center justify-between p-3 rounded border-2 transition-all ${
                isSelected
                  ? "border-flag bg-flag/5 scale-105"
                  : "border-ink/10 hover:border-ink bg-white/50"
              } ${hasVoted ? "cursor-default" : "hover:-translate-y-0.5 active:translate-y-0"}`}
            >
              <span className="text-3xl mb-1 filter drop-shadow">{r.emoji}</span>
              <span className="text-xs font-bold text-ink mb-2">{r.label}</span>
              
              <div className="w-full bg-ink/10 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${r.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-[10px] font-extrabold text-muted">
                <span>{r.count} votes</span>
                <span>{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
