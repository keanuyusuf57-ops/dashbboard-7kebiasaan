"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Taat Beribadah", value: 85, color: "#6366F1" }, // Indigo
  { name: "Rajin Belajar", value: 75, color: "#8B5CF6" },  // Purple
  { name: "Makan Sehat", value: 90, color: "#3B82F6" },   // Blue
  { name: "Tidur Cepat", value: 70, color: "#A855F7" },   // Purple Soft
  { name: "Rajin Olahraga", value: 80, color: "#0EA5E9" }, // Sky Blue
  { name: "Bermasyarakat", value: 65, color: "#4F46E5" }, // Deep Indigo
  { name: "Bangun Pagi", value: 88, color: "#C084FC" },   // Violet Light
];

export default function HabitDonutChart() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 text-lg mb-4">Kemajuan 7 Kebiasaan</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600 font-medium">{item.name}:</span>
            <span className="font-bold text-slate-800">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}