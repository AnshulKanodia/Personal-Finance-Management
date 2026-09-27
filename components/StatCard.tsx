import React from "react";
import { formatINR } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant: "emerald" | "rose" | "sky" | "amber" | "zinc";
  subtitle?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  icon: Icon,
  variant,
  subtitle,
  badge,
}) => {
  const variantStyles = {
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]",
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      amountColor: "text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    rose: {
      border: "border-rose-500/20 hover:border-rose-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]",
      iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
      amountColor: "text-rose-400",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    sky: {
      border: "border-sky-500/20 hover:border-sky-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(14,165,233,0.15)]",
      iconBg: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
      amountColor: "text-sky-400",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    },
    amber: {
      border: "border-amber-500/20 hover:border-amber-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
      iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      amountColor: "text-amber-400",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    zinc: {
      border: "border-zinc-800 hover:border-zinc-700",
      glow: "hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]",
      iconBg: "bg-zinc-800 text-zinc-300 border border-zinc-700",
      amountColor: "text-zinc-100",
      badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
    },
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-panel p-5 transition-all duration-300 ${variantStyles.border} ${variantStyles.glow} group hover:-translate-y-0.5`}
    >
      {/* Top hairline glass reflection */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${variantStyles.iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${variantStyles.amountColor}`}>
          {formatINR(amount)}
        </div>
        {(subtitle || badge) && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400">
            {subtitle && <span>{subtitle}</span>}
            {badge && (
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${variantStyles.badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
