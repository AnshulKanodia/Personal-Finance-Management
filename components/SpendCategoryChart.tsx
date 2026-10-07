"use client";

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";
import { PieChart as PieChartIcon, RotateCcw } from "lucide-react";
import { formatINR } from "@/lib/utils";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Active item determined by hover (desktop) or explicit 1-tap selection (mobile/desktop)
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;
  const activePercent =
    activeItem && grandTotal > 0 ? ((activeItem.total / grandTotal) * 100).toFixed(1) : "0";

  // Smooth pop-out active shape without any blocking tooltip overlay
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g style={{ outline: "none", cursor: "pointer" }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#060608"
          strokeWidth={3}
          style={{
            outline: "none",
            filter: "drop-shadow(0px 0px 8px rgba(0,0,0,0.7))",
          }}
        />
      </g>
    );
  };

  const handleSliceClick = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
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

        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedIndex !== null && (
            <button
              onClick={() => {
                setSelectedIndex(null);
                setHoveredIndex(null);
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex items-center gap-1 transition-all active:scale-95"
              title="Reset selection"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 font-mono whitespace-nowrap">
            Total: {formatINR(grandTotal)}
          </span>
        </div>
      </div>

      <div className="h-60 w-full relative">
        {/* Center label: displays category breakdown cleanly in the donut hole on 1-tap/hover, or total categories when idle */}
        <div
          onClick={() => {
            if (selectedIndex !== null) {
              setSelectedIndex(null);
              setHoveredIndex(null);
            }
          }}
          className={`absolute inset-0 flex flex-col items-center justify-center z-10 px-3 text-center transition-all duration-150 ${
            activeItem ? "cursor-pointer" : "pointer-events-none"
          }`}
        >
          {activeItem ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150 max-w-[110px]">
              <div className="flex items-center gap-1.5 max-w-[105px] justify-center truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: activeItem.color }}
                />
                <span className="text-xs font-bold text-zinc-100 truncate">
                  {activeItem.name}
                </span>
              </div>
              <span className="text-base font-extrabold text-rose-400 font-mono mt-0.5 tracking-tight">
                {formatINR(activeItem.total)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {activePercent}% • {activeItem.count} {activeItem.count === 1 ? "txn" : "txns"}
              </span>
              <span className="text-[9px] text-zinc-500 mt-0.5 opacity-70">
                Tap to reset
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center animate-in fade-in duration-150">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                Categories
              </span>
              <span className="text-lg font-bold text-zinc-200">{data.length}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5">Tap slice to view</span>
            </div>
          )}
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
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              onClick={(_, index) => handleSliceClick(index)}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              cursor="pointer"
              style={{ outline: "none" }}
            >
              {data.map((entry, index) => {
                const isDimmed = activeIndex !== null && activeIndex !== index;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || "#10b981"}
                    stroke="#09090b"
                    strokeWidth={2}
                    fillOpacity={isDimmed ? 0.35 : 1}
                    style={{
                      outline: "none",
                      cursor: "pointer",
                      transition: "fill-opacity 0.2s ease",
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List Breakdown: 1-Tap Interactive Buttons */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-zinc-800/60">
        {data.slice(0, 6).map((item, idx) => {
          const percent = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(0) : "0";
          const isSelected = activeIndex === idx;
          return (
            <button
              key={item._id || item.name}
              type="button"
              onClick={() => handleSliceClick(idx)}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all active:scale-95 text-left ${
                isSelected
                  ? "bg-zinc-800/95 border-sky-500/60 shadow-[0_0_15px_rgba(14,165,233,0.2)] ring-1 ring-sky-500/40"
                  : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-750 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className={`truncate font-medium ${
                    isSelected ? "text-zinc-100 font-bold" : "text-zinc-300"
                  }`}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 ml-1">
                <span className="text-zinc-200 font-mono text-[11px] font-semibold">
                  {formatINR(item.total)}
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {percent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
