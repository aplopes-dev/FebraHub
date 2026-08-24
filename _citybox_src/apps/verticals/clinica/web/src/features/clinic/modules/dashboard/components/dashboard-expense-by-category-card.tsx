'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart } from 'recharts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ChartConfig,
} from '@citybox/ui/atoms';
import type { ExpenseByCategoryPeriodMode } from '../types/clinic-dashboard';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { formatDashboardAmountFromCents } from '../lib/format-dashboard-currency';
import { buildExpenseCategoryCashFlowHref } from '../lib/cash-flow-deep-link';
import {
  EXPENSE_BY_CATEGORY_PERIOD_MODE_OPTIONS,
  resolveExpenseByCategoryPeriodRange,
} from '../lib/dashboard-expense-by-category';
import { useDashboardExpenseByCategoryQuery } from '../hooks/use-dashboard-expense-by-category-query';

const PIE_INNER_RADIUS = 118;
const PIE_OUTER_RADIUS = 148;

function isPeriodMode(value: string): value is ExpenseByCategoryPeriodMode {
  return value === 'annual' || value === 'monthly';
}

export function DashboardExpenseByCategoryCard() {
  const currentYear = new Date().getFullYear();
  const [periodMode, setPeriodMode] =
    useState<ExpenseByCategoryPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);

  const query = useDashboardExpenseByCategoryQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  const summary = query.data;

  const periodRange = useMemo(
    () =>
      resolveExpenseByCategoryPeriodRange({
        mode: periodMode,
        year,
        month,
      }),
    [periodMode, year, month],
  );

  const pieConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of summary.items) {
      config[item.categoryId] = { label: item.label, color: item.color };
    }
    return config;
  }, [summary.items]);

  const pieData = useMemo(
    () =>
      summary.items.map((item) => ({
        categoryId: item.categoryId,
        label: item.label,
        value: item.amountCents,
        percent: item.percent,
        fill: item.color,
      })),
    [summary.items],
  );

  const hasData = summary.totalCents > 0;

  return (
    <Card className="gap-2 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
        <CardTitle className="text-xl font-semibold">
          Despesa por categoria
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={periodMode}
            onValueChange={(value) => {
              if (isPeriodMode(value)) setPeriodMode(value);
            }}
          >
            <SelectTrigger
              className="w-28"
              aria-label="Período das despesas por categoria"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_BY_CATEGORY_PERIOD_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periodMode === 'monthly' ? (
            <Select
              value={String(month)}
              onValueChange={(value) => {
                const next = Number(value);
                if (Number.isInteger(next)) setMonth(next);
              }}
            >
              <SelectTrigger
                className="w-36"
                aria-label="Mês das despesas por categoria"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select
            value={String(year)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isInteger(next)) setYear(next);
            }}
          >
            <SelectTrigger
              className="w-24"
              aria-label="Ano das despesas por categoria"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-5 pb-5">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando despesas por categoria…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar as despesas por categoria.
          </p>
        ) : (
          <>
            <div className="relative mx-auto size-[360px]">
              {hasData ? (
                <>
                  <ChartContainer
                    config={pieConfig}
                    className="aspect-square h-full w-full"
                    initialDimension={{ width: 360, height: 360 }}
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, _name, item) => {
                              const percent = Number(
                                (
                                  item?.payload as
                                    | { percent?: number }
                                    | undefined
                                )?.percent ?? 0,
                              );
                              return `${formatDashboardAmountFromCents(Number(value))} · ${percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
                            }}
                          />
                        }
                      />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={PIE_INNER_RADIUS}
                        outerRadius={PIE_OUTER_RADIUS}
                        strokeWidth={2}
                      >
                        {pieData.map((slice) => (
                          <Cell key={slice.categoryId} fill={slice.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                    <p className="text-sm font-medium text-black">Total</p>
                    <p className="inline-flex items-baseline justify-center gap-1 text-black">
                      <span className="text-base font-medium">R$</span>
                      <span className="text-3xl font-semibold tabular-nums">
                        {formatDashboardAmountFromCents(summary.totalCents)}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  Nenhuma despesa no período
                </div>
              )}
            </div>

            <ul className="space-y-2.5">
              {summary.items.map((item) => {
                const href = buildExpenseCategoryCashFlowHref({
                  categoryId: item.categoryId,
                  startDate: periodRange.startDate,
                  endDate: periodRange.endDate,
                });
                return (
                  <li
                    key={item.categoryId}
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
                        aria-label={`Ver despesas de ${item.label}`}
                      >
                        Ver
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>

            <table className="sr-only">
              <caption>Despesas por categoria</caption>
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Percentual</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((item) => (
                  <tr key={item.categoryId}>
                    <th scope="row">{item.label}</th>
                    <td>{item.percent}%</td>
                    <td>{formatDashboardAmountFromCents(item.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
