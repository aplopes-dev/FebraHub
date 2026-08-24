'use client';

import { useState } from 'react';
import type { SalesOverviewPoint } from '../data/mock-reports';

type SalesOverviewChartProps = {
  data: SalesOverviewPoint[];
};

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SalesOverviewPoint | null>(data[3] || null);

  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxY = 7000;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxY) * chartHeight;
  };

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.sales),
    point: d,
  }));

  // Cria caminho suave (bezier cubic)
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`;

  const selectedPt = points.find((p) => p.point.month === (hoveredPoint?.month ?? 'Ago')) || points[3];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Linhas de Grade Horizontais */}
        {[0, 1000, 3000, 5000, 7000].map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#F0F0F0"
                strokeDasharray={val === 0 ? '0' : '4 4'}
                strokeWidth={1}
              />
              <text
                x={width - paddingRight + 8}
                y={y + 4}
                className="text-[10px] font-medium fill-[#A3A3A3]"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Linha Vertical Tracejada no ponto selecionado */}
        {selectedPt && (
          <line
            x1={selectedPt.x}
            y1={paddingTop}
            x2={selectedPt.x}
            y2={paddingTop + chartHeight}
            stroke="#22c55e"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            className="opacity-70"
          />
        )}

        {/* Área preenchida com gradiente verde */}
        <path d={areaD} fill="url(#salesGradient)" />

        {/* Linha do Gráfico */}
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />

        {/* Rótulos dos meses no eixo X */}
        {points.map((pt) => (
          <text
            key={pt.point.month}
            x={pt.x}
            y={height - 8}
            textAnchor="middle"
            className="text-[11px] font-medium fill-[#737373]"
          >
            {pt.point.month}
          </text>
        ))}

        {/* Pontos Clicáveis/Hover na linha */}
        {points.map((pt) => {
          const isSelected = pt.point.month === selectedPt.point.month;
          return (
            <g key={pt.point.month} className="cursor-pointer" onClick={() => setHoveredPoint(pt.point)}>
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
              {isSelected && (
                <circle cx={pt.x} cy={pt.y} r={6} fill="#22c55e" stroke="#ffffff" strokeWidth={2.5} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip Card suspenso no ponto ativo (ex: Agosto 2024) */}
      {selectedPt && (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2 shadow-md transition-all duration-150"
          style={{
            left: `${(selectedPt.x / width) * 100}%`,
            top: `${(selectedPt.y / height) * 100 - 12}%`,
          }}
        >
          <div className="text-[11px] font-semibold text-[#737373]">{selectedPt.point.label}</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
            <span className="size-2 rounded-full bg-[#22c55e]" />
            <span>Vendas:</span>
            <span className="font-extrabold text-[#171717]">
              R$ {selectedPt.point.sales.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
