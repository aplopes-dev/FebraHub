'use client';

import Link from 'next/link';
import {
  CakeSlice,
  CircleDollarSign,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { Button, Card, CardContent } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';

type DashboardKpiCardProps = {
  value: string;
  label: string;
  icon: LucideIcon;
  onView?: () => void;
  viewHref?: string;
  className?: string;
};

export function DashboardKpiCard({
  value,
  label,
  icon: Icon,
  onView,
  viewHref,
  className,
}: DashboardKpiCardProps) {
  const viewControl = viewHref ? (
    <Button
      asChild
      variant="link"
      className="h-auto shrink-0 px-0 text-sm font-medium"
    >
      <Link href={viewHref} aria-label={`Ver ${label.toLowerCase()}`}>
        Ver
      </Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="link"
      className="h-auto shrink-0 px-0 text-sm font-medium"
      aria-label={`Ver ${label.toLowerCase()}`}
      onClick={onView}
    >
      Ver
    </Button>
  );

  return (
    <Card className={cn('h-full py-0', className)}>
      <CardContent className="flex min-h-24 items-center gap-3 p-4 sm:gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground tabular-nums xl:text-xl">
              {value}
            </p>
            {viewControl}
          </div>
          <p className="mt-1 min-w-0 text-sm font-medium leading-snug text-pretty text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type DashboardKpiCardsProps = {
  overdueIncomeTotalCents: number;
  openRejectedBudgetsTotalCents: number;
  upcomingBirthdaysCount: number;
  overdueHref: string;
  overdueIncomeLoading?: boolean;
  overdueIncomeError?: boolean;
  openRejectedBudgetsLoading?: boolean;
  openRejectedBudgetsError?: boolean;
  upcomingBirthdaysLoading?: boolean;
  upcomingBirthdaysError?: boolean;
  onOpenBudgets: () => void;
  onOpenBirthdays: () => void;
};

export function DashboardKpiCards({
  overdueIncomeTotalCents,
  openRejectedBudgetsTotalCents,
  upcomingBirthdaysCount,
  overdueHref,
  overdueIncomeLoading = false,
  overdueIncomeError = false,
  openRejectedBudgetsLoading = false,
  openRejectedBudgetsError = false,
  upcomingBirthdaysLoading = false,
  upcomingBirthdaysError = false,
  onOpenBudgets,
  onOpenBirthdays,
}: DashboardKpiCardsProps) {
  const overdueValue = overdueIncomeLoading
    ? 'Carregando...'
    : overdueIncomeError
      ? '—'
      : formatDashboardCurrencyFromCents(overdueIncomeTotalCents);

  const budgetsValue = openRejectedBudgetsLoading
    ? 'Carregando...'
    : openRejectedBudgetsError
      ? '—'
      : formatDashboardCurrencyFromCents(openRejectedBudgetsTotalCents);

  const birthdaysValue = upcomingBirthdaysLoading
    ? 'Carregando...'
    : upcomingBirthdaysError
      ? '—'
      : String(upcomingBirthdaysCount);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <DashboardKpiCard
        value={overdueValue}
        label="Débitos em atraso"
        icon={CircleDollarSign}
        viewHref={overdueHref}
      />
      <DashboardKpiCard
        value={budgetsValue}
        label="Orçamentos em aberto e reprovados"
        icon={ClipboardList}
        onView={onOpenBudgets}
      />
      <DashboardKpiCard
        value={birthdaysValue}
        label="Aniversariantes nos próximos 30 dias"
        icon={CakeSlice}
        onView={onOpenBirthdays}
      />
    </div>
  );
}
