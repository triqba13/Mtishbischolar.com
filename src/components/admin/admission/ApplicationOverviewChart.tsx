"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface ChartDataPoint {
  day: string;
  New: number;
  "Ready for Review": number;
  "Documents Pending": number;
  "University Processing": number;
  "Visa Processing": number;
}

interface ApplicationOverviewChartProps {
  chartData?: ChartDataPoint[];
  chartDataByRange?: Record<string, ChartDataPoint[]>;
}

const SERIES = [
  { key: "New", color: "#3B82F6" },
  { key: "Ready for Review", color: "#10B981" },
  { key: "Documents Pending", color: "#F97316" },
  { key: "University Processing", color: "#8B5CF6" },
  { key: "Visa Processing", color: "#06B6D4" },
];

const RANGES = ["Last 7 Days", "Last 30 Days", "Last 3 Months", "Custom"];

export default function ApplicationOverviewChart({
  chartData,
  chartDataByRange,
}: ApplicationOverviewChartProps) {
  const [range, setRange] = useState("Last 7 Days");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedData =
    chartDataByRange?.[range] ||
    chartData || [
      {
        day: "Today",
        New: 0,
        "Ready for Review": 0,
        "Documents Pending": 0,
        "University Processing": 0,
        "Visa Processing": 0,
      },
    ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-slate-800 text-base">Application Overview</h3>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            {range}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRange(r);
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                    range === r ? "text-blue-600 font-bold bg-blue-50" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={selectedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "12px",
              padding: "10px 14px",
            }}
            labelStyle={{ color: "#94A3B8", marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            iconType="circle"
            iconSize={8}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={{ fill: s.color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
