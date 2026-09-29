"use client";

import React, { useState } from "react";
import {
  Gauge,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Calendar,
  Flame,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PrivacyMask } from "@/components/PrivacyMask";
import { usePreferences } from "@/lib/preferences";

export interface VelocityPeriodData {
  currentSpend: number;
  previousSpend: number;
  changePercent: number;
  burnRatePerDay: number;
  pace: "SLOWER" | "STEADY" | "FASTER";
}

export interface SpendingVelocityProps {
  velocity?: {
    weekly: VelocityPeriodData;
    monthly: VelocityPeriodData;
  };
}

export const SpendingVelocityCard: React.FC<SpendingVelocityProps> = ({ velocity }) => {
  const { prefs, update } = usePreferences();
  const [activePeriod, setActivePeriod] = useState<"WEEKLY" | "MONTHLY">(
    prefs.velocityPeriod || "WEEKLY"
  );

  if (!velocity) return null;

  const currentData = activePeriod === "WEEKLY" ? velocity.weekly : velocity.monthly;
  const isWeekly = activePeriod === "WEEKLY";

  const handlePeriodToggle = (p: "WEEKLY" | "MONTHLY") => {
    setActivePeriod(p);
    update({ velocityPeriod: p });
  };

  const paceConfig = {
    SLOWER: {
      label: "Disciplined Pace",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      icon: TrendingDown,
      subtext: isWeekly
        ? `Spending ${Math.abs(currentData.changePercent)}% less than last week's pace`
        : `Spending ${Math.abs(currentData.changePercent)}% less than last month`,
      accentGlow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      barColor: "from-emerald-500 to-teal-400",
    },
    STEADY: {
      label: "Steady Pace",
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/30",
      icon: Minus,
      subtext: isWeekly
        ? "Spending closely matches last week's daily run-rate"
        : "Spending on track with last month's run-rate",
      accentGlow: "shadow-[0_0_20px_rgba(14,165,233,0.15)]",
      barColor: "from-sky-500 to-cyan-400",
    },
    FASTER: {
      label: "Accelerated Burn",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
      icon: TrendingUp,
      subtext: isWeekly
        ? `Spending +${currentData.changePercent}% faster than last week`
        : `Spending +${currentData.changePercent}% faster than last month`,
      accentGlow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
      barColor: "from-rose-500 to-amber-500",
    },
  }[currentData.pace];

  const Icon = paceConfig.icon;

  // Visual Gauge Fill Percentage (relative to baseline)
  let gaugePercent = 50;
  if (currentData.previousSpend > 0) {
    const ratio = (currentData.currentSpend / currentData.previousSpend) * 100;
    gaugePercent = Math.min(100, Math.max(10, Math.round(ratio)));
  }

  return (
    <div className={`rounded-2xl glass-panel p-4 sm:p-5 border border-zinc-800 relative overflow-hidden transition-all duration-300 ${paceConfig.accentGlow}`}>
      {/* Top Hairline Glow */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header with Switcher */}
      <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-inner flex-shrink-0">
            <Gauge className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>Spending Velocity</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${paceConfig.bg} ${paceConfig.color}`}>
                <Icon className="w-3 h-3 stroke-[2.5]" />
                {paceConfig.label}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {paceConfig.subtext}
            </p>
          </div>
        </div>

        {/* Period Switcher Button Group */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 text-[11px] font-medium flex-shrink-0 self-end sm:self-auto">
          <button
            onClick={() => handlePeriodToggle("WEEKLY")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              isWeekly
                ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => handlePeriodToggle("MONTHLY")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              !isWeekly
                ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        {/* Daily Burn Rate */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{isWeekly ? "Daily Burn (Week)" : "Daily Burn (Month)"}</span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-zinc-100 mt-1">
            <PrivacyMask>{formatINR(currentData.burnRatePerDay)}</PrivacyMask>
            <span className="text-[10px] text-zinc-500 font-normal font-sans ml-1">/ day</span>
          </div>
        </div>

        {/* Current Period Spend */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{isWeekly ? "This Week" : "This Month"}</span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-zinc-100 mt-1">
            <PrivacyMask>{formatINR(currentData.currentSpend)}</PrivacyMask>
          </div>
        </div>

        {/* Previous Period Baseline */}
        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>{isWeekly ? "Prior Week Benchmark" : "Prior Month"}</span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-zinc-400 mt-1">
            <PrivacyMask>{formatINR(currentData.previousSpend)}</PrivacyMask>
          </div>
        </div>
      </div>

      {/* Progress Bar & Pace Bar */}
      <div className="mt-3 pt-2.5 border-t border-zinc-850/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
          <span>Run-rate velocity gauge:</span>
          <span className={paceConfig.color}>
            {currentData.changePercent > 0 ? `+${currentData.changePercent}%` : `${currentData.changePercent}%`} vs baseline
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/60 p-[1px]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${paceConfig.barColor} transition-all duration-500`}
            style={{ width: `${gaugePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
