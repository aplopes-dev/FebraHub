'use client';

import {
  CalendarX,
  CircleDollarSign,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { formatDashboardCurrencyFromCents } from '@/features/clinic/modules/dashboard/lib/format-dashboard-currency';
import type { IndicacoesKpis } from '../types/indicacoes';

type IndicacoesKpiCardProps = {
  value: string;
  label: string;
  icon: LucideIcon;
  className?: string;
};

function IndicacoesKpiCard({
  value,
  label,
  icon: Icon,
  className,
}: IndicacoesKpiCardProps) {
  return (
    <Card className={cn('h-full py-0', className)}>
      <CardContent className="flex min-h-24 items-center gap-3 p-4 sm:gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground tabular-nums xl:text-xl">
            {value}
          </p>
          <p className="mt-1 min-w-0 text-sm font-medium leading-snug text-pretty text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type IndicacoesKpiCardsProps = {
  kpis: IndicacoesKpis;
};

export function IndicacoesKpiCards({ kpis }: IndicacoesKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <IndicacoesKpiCard
        value={String(kpis.totalReferrals)}
        label="Indicações totais"
        icon={Users}
      />
      <IndicacoesKpiCard
        value={formatDashboardCurrencyFromCents(kpis.approvedBudgetsValueCents)}
        label="Valor em orçamentos aprovados"
        icon={CircleDollarSign}
      />
      <IndicacoesKpiCard
        value={String(kpis.withoutScheduledAppointment)}
        label="Indicados sem consulta agendada"
        icon={CalendarX}
      />
    </div>
  );
}
