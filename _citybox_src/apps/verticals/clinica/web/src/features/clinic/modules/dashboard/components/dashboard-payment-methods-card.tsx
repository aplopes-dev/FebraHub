'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { DatePickerField } from '@/features/clinic/financeiro/_ui/fields';
import {
  COMMISSION_PERIOD_OPTIONS,
  type CommissionPeriodFilter,
} from '@/features/clinic/financeiro/comissoes/types/commission-financial.types';
import { resolveCommissionPeriodDates } from '@/features/clinic/financeiro/comissoes/lib/filter-commissions-by-period';
import { formatDashboardAmountFromCents } from '../lib/format-dashboard-currency';
import {
  mapPaymentMethodsApiToSummary,
  paymentMethodBarSegments,
} from '../lib/dashboard-payment-methods';
import { buildPaymentMethodTransactionsHref } from '../lib/transactions-deep-link';
import { useDashboardPaymentMethodsQuery } from '../hooks/use-dashboard-payment-methods-query';

function isPeriodFilter(value: string): value is CommissionPeriodFilter {
  return COMMISSION_PERIOD_OPTIONS.some((option) => option.value === value);
}

export function DashboardPaymentMethodsCard() {
  const [period, setPeriod] =
    useState<CommissionPeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const periodRange = useMemo(
    () => resolveCommissionPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const query = useDashboardPaymentMethodsQuery({
    startDate: periodRange.startDate,
    endDate: periodRange.endDate,
  });

  const summary = useMemo(
    () => mapPaymentMethodsApiToSummary(query.data),
    [query.data],
  );

  const barSegments = useMemo(
    () => paymentMethodBarSegments(summary.items),
    [summary.items],
  );

  const handlePeriodChange = (next: CommissionPeriodFilter) => {
    setPeriod(next);
    if (next !== 'custom') {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  return (
    <Card className="gap-2 py-0">
      <CardHeader className="flex flex-col gap-3 px-5 pt-5 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl font-semibold">
          Recebimentos por meio de pagamento
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="shrink-0 text-sm text-black">
            Exibindo meios de pagamento
          </Label>
          <Select
            value={period}
            onValueChange={(value) => {
              if (isPeriodFilter(value)) handlePeriodChange(value);
            }}
          >
            <SelectTrigger
              className="w-[200px]"
              aria-label="Período dos meios de pagamento"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMISSION_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {period === 'custom' ? (
            <>
              <DatePickerField
                placeholder="Data inicial"
                value={customStart}
                onChange={setCustomStart}
                dateFormat="short"
                className="w-40"
              />
              <DatePickerField
                placeholder="Data final"
                value={customEnd}
                onChange={setCustomEnd}
                dateFormat="short"
                className="w-40"
              />
            </>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-5 pb-5">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando recebimentos…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar os recebimentos.
          </p>
        ) : (
          <>
            <div className="mx-auto max-w-3xl space-y-2 text-center">
              <p className="inline-flex items-baseline justify-center gap-1.5 text-black">
                <span className="text-base font-medium text-black">R$</span>
                <span className="text-3xl font-semibold tabular-nums">
                  {formatDashboardAmountFromCents(summary.totalCents)}
                </span>
              </p>
              <p className="text-sm text-black">Total recebido</p>
            </div>

            <div
              className="h-5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label="Distribuição dos recebimentos por meio de pagamento"
            >
              {barSegments.length === 0 ? (
                <div className="h-full w-full rounded-full bg-muted" />
              ) : (
                <div className="flex h-full w-full overflow-hidden rounded-full">
                  {barSegments.map((item, index) => (
                    <div
                      key={item.method}
                      className={cn(
                        'h-full min-w-0 transition-all',
                        index === 0 && 'rounded-l-full',
                        index === barSegments.length - 1 && 'rounded-r-full',
                      )}
                      style={{
                        flexGrow: item.amountCents,
                        flexBasis: 0,
                        backgroundColor: item.color,
                      }}
                      title={`${item.label}: ${item.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                    />
                  ))}
                </div>
              )}
            </div>

            <ul className="space-y-2.5">
              {summary.items.map((item) => {
                const href = buildPaymentMethodTransactionsHref({
                  paymentMethod: item.method,
                  period,
                  startDate: periodRange.startDate,
                  endDate: periodRange.endDate,
                });
                return (
                  <li
                    key={item.method}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-x-4 gap-y-1 text-sm"
                  >
                    <span
                      className="size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate text-black">
                      {item.label}
                    </span>
                    <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-muted px-2 font-medium tabular-nums text-black">
                      {`${item.percent.toLocaleString('pt-BR', {
                        maximumFractionDigits: 1,
                      })}%`}
                    </span>
                    <span className="inline-flex min-w-28 items-baseline justify-end gap-1 text-black">
                      <span className="text-xs font-normal text-black">R$</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatDashboardAmountFromCents(item.amountCents)}
                      </span>
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="xs"
                      className="h-6 bg-transparent px-3 text-primary shadow-none hover:bg-transparent hover:text-primary"
                    >
                      <Link
                        href={href}
                        aria-label={`Ver recebimentos em ${item.label}`}
                      >
                        Ver
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
