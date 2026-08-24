'use client';

type StatusLegendItem = {
  label: string;
  count: number;
  color: string;
  hasWarningIcon?: boolean;
};

type StatusDonutChartProps = {
  total: number;
  totalLabel: string;
  items: StatusLegendItem[];
};

export function StatusDonutChart({ total, totalLabel, items }: StatusDonutChartProps) {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calcula segmentos no círculo
  let cumulativePercent = 0;

  const slices = items.map((item) => {
    const percent = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 w-full select-none">
      {/* Gráfico de Rosca */}
      <div className="relative flex items-center justify-center size-[180px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F5F5F5"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, i) => (
            <circle
              key={slice.label || i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* Texto do Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#171717]">{total}</span>
          <span className="text-[11px] font-semibold text-[#737373] leading-tight max-w-[90px]">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legenda dos Status em Lista */}
      <div className="w-full rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#525252]">{item.label}</span>
              {item.hasWarningIcon && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                  !
                </span>
              )}
            </div>
            <span className="font-bold text-[#171717]">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
