'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@citybox/ui';
import type { PetroskiComposition } from '../../../lib/nutrition-petroski';

const SKINFOLD_BAR_COLORS = [
  'bg-sky-200',
  'bg-violet-200',
  'bg-emerald-200',
  'bg-amber-200',
  'bg-rose-200',
  'bg-cyan-200',
  'bg-indigo-200',
  'bg-lime-200',
  'bg-orange-200',
] as const;

const PIE_COLORS = {
  lean: 'var(--color-sky-500, #0ea5e9)',
  fat: 'var(--color-amber-500, #f59e0b)',
} as const;

type PatientNutritionPetroskiChartsProps = {
  composition: PetroskiComposition;
  className?: string;
};

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatMm(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} mm`;
}

export function PatientNutritionPetroskiCharts({
  composition,
  className,
}: PatientNutritionPetroskiChartsProps) {
  const maxMedian = Math.max(
    ...composition.medians.map((item) => item.medianMm),
    1,
  );

  const fatPercent =
    Math.round(composition.fatPercent * 10) / 10;
  const leanPercent =
    Math.round((100 - composition.fatPercent) * 10) / 10;

  const pieData = [
    {
      id: 'lean',
      name: 'Massa magra',
      value: leanPercent,
      fill: PIE_COLORS.lean,
    },
    {
      id: 'fat',
      name: 'Massa gorda',
      value: fatPercent,
      fill: PIE_COLORS.fat,
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold text-foreground">
        Distribuição de gordura
      </h4>
      <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-8">
        <div className="space-y-2">
          {composition.medians.map((item, index) => {
            const widthPercent = Math.max(
              18,
              Math.round((item.medianMm / maxMedian) * 100),
            );
            const colorClass =
              SKINFOLD_BAR_COLORS[index % SKINFOLD_BAR_COLORS.length];

            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex h-9 items-center overflow-hidden rounded-md px-3 text-sm font-medium text-black',
                  colorClass,
                )}
                style={{ width: `${widthPercent}%` }}
                title={`${item.label}: ${formatMm(item.medianMm)}`}
              >
                <span className="truncate">
                  {item.label}
                  <span className="ml-2 tabular-nums text-black/80">
                    {formatMm(item.medianMm)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-64 min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number'
                      ? formatPercent(value)
                      : String(value),
                    String(name),
                  ]}
                  contentStyle={{ color: '#000' }}
                  labelStyle={{ color: '#000' }}
                  itemStyle={{ color: '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex shrink-0 flex-col gap-2 text-sm">
            {pieData.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                  aria-hidden
                />
                <span className="font-medium text-black">{entry.name}:</span>
                <span className="font-semibold tabular-nums text-primary">
                  {formatPercent(entry.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
