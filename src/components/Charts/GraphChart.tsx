import React, { useState, useEffect } from "react";

type DataItem = {
  label: string;
  value1: number;
  value2: number;
};

const initialData: DataItem[] = [
  { label: "Jan", value1: 40, value2: 30 },
  { label: "Feb", value1: 70, value2: 50 },
  { label: "Mar", value1: 55, value2: 65 },
  { label: "Apr", value1: 90, value2: 70 },
  { label: "May", value1: 65, value2: 85 },
];

const GraphChart: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [hovered, setHovered] = useState<{
    index: number;
    line: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          value1: Math.floor(Math.random() * 100) + 20,
          value2: Math.floor(Math.random() * 100) + 20,
        }))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const width = 500;
  const height = 220;
  const padding = 40;

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.value1, d.value2])
  );

  const getPoints = (key: "value1" | "value2") =>
    data.map((d, i) => {
      const x =
        padding + (i * (width - padding * 2)) / (data.length - 1);
      const y =
        height -
        padding -
        (d[key] / maxValue) * (height - padding * 2);

      return { x, y, value: d[key], label: d.label };
    });

  const points1 = getPoints("value1");
  const points2 = getPoints("value2");

  const createPath = (points: typeof points1) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

  return (
    <div className="w-full h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Sales Overview
        </h2>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid */}
        {[0, 25, 50, 75, 100].map((_, i) => {
          const y =
            padding + (i * (height - padding * 2)) / 4;
          return (
            <line
              key={i}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#E5E7EB"
            />
          );
        })}

        {/* Line 1 */}
        <path
          d={createPath(points1)}
          fill="none"
          stroke="#4F46E5"
          strokeWidth={3}
        />

        {/* Line 2 */}
        <path
          d={createPath(points2)}
          fill="none"
          stroke="#10B981"
          strokeWidth={3}
        />

        {/* Points */}
        {[points1, points2].map((points, lineIndex) =>
          points.map((p, i) => (
            <g key={`${lineIndex}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hovered?.index === i && hovered.line === lineIndex ? 6 : 4}
                fill={lineIndex === 0 ? "#4F46E5" : "#10B981"}
                onMouseEnter={() =>
                  setHovered({ index: i, line: lineIndex })
                }
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              />

              {/* Tooltip */}
              {hovered?.index === i && hovered.line === lineIndex && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#111827"
                >
                  {p.value}
                </text>
              )}

              {/* Labels (only once) */}
              {lineIndex === 0 && (
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))
        )}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-indigo-600 rounded-full" />
          Line 1
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-emerald-500 rounded-full" />
          Line 2
        </div>
      </div>
    </div>
  );
};

export default GraphChart;