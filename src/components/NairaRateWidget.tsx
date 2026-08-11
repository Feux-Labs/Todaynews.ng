"use client";

import React, { useState } from "react";
import { TrendingUp, RefreshCw, ArrowUpRight, ShieldCheck } from "lucide-react";
import { INITIAL_NAIRA_RATES } from "../lib/sample-data";

export default function NairaRateWidget() {
  const [rates, setRates] = useState(INITIAL_NAIRA_RATES);
  const [loading, setLoading] = useState(false);

  const refreshRates = () => {
    setLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      // Slightly fluctuate rate to simulate live API
      const randomFluctuation = () => Math.floor(Math.random() * 11) - 5; // -5 to +5 Naira
      const usdParallelVal = 1610 + randomFluctuation();
      const usdOfficialVal = 1595 + randomFluctuation();
      const gbpParallelVal = 2080 + randomFluctuation();
      const eurParallelVal = 1740 + randomFluctuation();

      setRates({
        usdParallel: `₦${usdParallelVal.toLocaleString()} / $1`,
        usdOfficial: `₦${usdOfficialVal.toLocaleString()} / $1`,
        gbpParallel: `₦${gbpParallelVal.toLocaleString()} / £1`,
        eurParallel: `₦${eurParallelVal.toLocaleString()} / €1`,
        lastUpdated: "Just updated",
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-ink text-paper rounded border-2 border-ink shadow-md p-4 my-4 font-body">
      <div className="flex items-center justify-between border-b border-paper/10 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-hazard animate-pulse" />
          <h3 className="font-display font-black text-sm md:text-base tracking-wide text-paper uppercase">
            Naira Rate Watch <span className="text-hazard font-mono text-[10px] bg-paper/10 px-1 py-0.5 rounded">Parallel vs CBN</span>
          </h3>
        </div>
        <button
          onClick={refreshRates}
          disabled={loading}
          className="text-xs text-hazard font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-paper/5 p-2.5 rounded border border-paper/10">
          <span className="text-[10px] text-muted uppercase block font-bold tracking-wider">
            USD Parallel (Street)
          </span>
          <span className="text-base font-black font-mono text-hazard flex items-center gap-0.5 mt-0.5">
            {rates.usdParallel}
            <ArrowUpRight className="h-3 w-3 text-flag" />
          </span>
        </div>

        <div className="bg-paper/5 p-2.5 rounded border border-paper/10">
          <span className="text-[10px] text-muted uppercase block font-bold tracking-wider">
            USD Official (NAFEM)
          </span>
          <span className="text-base font-black font-mono text-paper flex items-center gap-0.5 mt-0.5">
            {rates.usdOfficial}
            <ShieldCheck className="h-3.5 w-3.5 text-flag fill-current" />
          </span>
        </div>

        <div className="bg-paper/5 p-2.5 rounded border border-paper/10">
          <span className="text-[10px] text-muted uppercase block font-bold tracking-wider">
            GBP Parallel
          </span>
          <span className="text-base font-black font-mono text-hazard flex items-center gap-0.5 mt-0.5">
            {rates.gbpParallel}
            <ArrowUpRight className="h-3 w-3 text-flag" />
          </span>
        </div>

        <div className="bg-paper/5 p-2.5 rounded border border-paper/10">
          <span className="text-[10px] text-muted uppercase block font-bold tracking-wider">
            EUR Parallel
          </span>
          <span className="text-base font-black font-mono text-hazard flex items-center gap-0.5 mt-0.5">
            {rates.eurParallel}
            <ArrowUpRight className="h-3 w-3 text-flag" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-muted font-medium">
        <span>* Street rates fluctuate. Always cross-check before transaction.</span>
        <span>{rates.lastUpdated}</span>
      </div>
    </div>
  );
}
