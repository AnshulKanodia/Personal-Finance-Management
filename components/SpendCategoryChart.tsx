"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

interface CategorySpendItem {
  _id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
}

interface SpendCategoryChartProps {
  data: CategorySpendItem[];
}

export const SpendCategoryChart: React.FC<SpendCategoryChartProps> = ({ data }) => {
  const [isTooltipActive, setIsTooltipActive] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800/80 min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
          📊
        </div>
        <p className="text-sm font-medium text-zinc-300">No expense records this month</p>
        <p className="text-xs text-zinc-500 mt-1">Expenses you log will show up here by category</p>
      </div>
    );
  }

  const grandTotal = data.reduce((acc, curr) => acc + curr.total, 0);

  // Custom Active Shape to replace default browser outline with subtle smooth pop-out
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g style={{ outline: "none" }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#060608"
          strokeWidth={2}
          style={{ outline: "none" }}
        />
      </g>
    );
  };

  // Custom Tooltip for Recharts with solid background and z-index isolation
  const CustomTooltip = ({ active, payload }: any) => {
    useEffect(() => {
      setIsTooltipActive(Boolean(active && payload && payload.length));
      return () => setIsTooltipActive(false);
    }, [active, payload]);

    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpendItem;
      const percent = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : "0";
      return (
        <div className="bg-zinc-950 border border-zinc-700/80 p-3 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.9)] relative z-50 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block shadow-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs font-semibold text-zinc-100">{item.name}</span>
          </div>
          <div className="mt-1 text-base font-bold text-rose-400 font-mono">
            {formatINR(item.total)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {percent}% of total • {item.count} transaction{item.count > 1 ? "s" : ""}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sky-400 shadow-inner flex-shrink-0">
            <PieChartIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">
              Spend By Category
            </h3>
            <p className="text-[11px] text-zinc-400">Monthly expense distribution</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 font-mono whitespace-nowrap flex-shrink-0">
          Total: {formatINR(grandTotal)}
        </span>
      </div>

      <div className="h-60 w-full relative">
        {/* Center label: sits at z-10 behind the tooltip, smoothly fades out when active */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-all duration-200 ${
            isTooltipActive ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            Categories
          </span>
          <span className="text-lg font-bold text-zinc-200">{data.length}</span>
        </div>

        <ResponsiveContainer width="100%" height="100%" className="relative z-20">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="total"
              nameKey="name"
              activeShape={renderActiveShape}
              style={{ outline: "none" }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || "#10b981"}
                  stroke="#09090b"
                  strokeWidth={2}
                  style={{ outline: "none" }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 50, outline: "none", pointerEvents: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List Breakdown */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-zinc-800/60">
        {data.slice(0, 6).map((item) => {
          const percent = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(0) : "0";
          return (
            <div
              key={item._id || item.name}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 text-xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-zinc-300 truncate font-medium">{item.name}</span>
              </div>
              <span className="text-zinc-400 font-mono text-[11px] ml-1 flex-shrink-0">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
