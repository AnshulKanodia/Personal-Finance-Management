"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
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

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpendItem;
      const percent = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : "0";
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
          </div>
          <div className="mt-1 text-base font-bold text-rose-400">
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium tracking-wider text-zinc-400 uppercase">
          Spend By Category
        </h3>
        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          Total: {formatINR(grandTotal)}
        </span>
      </div>

      <div className="h-60 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
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
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || "#10b981"}
                  stroke="#09090b"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            Categories
          </span>
          <span className="text-lg font-bold text-zinc-200">{data.length}</span>
        </div>
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
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
