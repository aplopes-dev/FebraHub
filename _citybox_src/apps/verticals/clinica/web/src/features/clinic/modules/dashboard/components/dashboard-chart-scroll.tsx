'use client';

import type { ReactNode } from 'react';
import { cn } from '@citybox/ui';

type DashboardChartScrollProps = {
  children: ReactNode;
  className?: string;
  /** Largura mínima do gráfico no mobile (habilita scroll horizontal). */
  minWidthClassName?: string;
};

/**
 * Evita compressão de eixos/labels em telas estreitas:
 * o gráfico mantém largura mínima e o container rola horizontalmente.
 *
 * `overflow-y-hidden` + `scrollbar-gutter:stable` evitam o loop de resize do
 * Recharts ResponsiveContainer quando a barra H aparece/some (ex.: sidebar).
 * Preferir altura fixa no ChartContainer filho — não encadear `h-full` aqui.
 */
export function DashboardChartScroll({
  children,
  className,
  minWidthClassName = 'min-w-[36rem]',
}: DashboardChartScrollProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-gutter-stable [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      <div className={minWidthClassName}>{children}</div>
    </div>
  );
}
