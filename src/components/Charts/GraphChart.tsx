import React, { useState, useEffect } from "react";

const initialData = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 70 },
  { label: "Mar", value: 55 },
  { label: "Apr", value: 90 },
  { label: "May", value: 65 },
];

const colors = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#22C55E",
  "#F59E0B",
];

const BarChart: React.FC = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          value: Math.floor(Math.random() * 100) + 20,
        }))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white shadow rounded-2xl p-6 h-72 hover:shadow-xl transition flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Sales Overview</h2>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div className="flex-1 flex items-end gap-4 relative min-h-[200px]">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((line) => (
            <div key={line} className="border-t border-gray-200 text-[10px] text-gray-300" />
          ))}
        </div>

        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;

          return (
            <div
              key={item.label}
              className="flex flex-col items-center flex-1 relative z-10"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === index && (
                <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg">
                  {item.value}
                </div>
              )}

              <div
                className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${hovered === index ? "opacity-100 scale-105" : "opacity-80"}`}
                style={{
                  height: `${Math.max(height, 8)}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />

              <span className="text-xs mt-2 text-gray-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
