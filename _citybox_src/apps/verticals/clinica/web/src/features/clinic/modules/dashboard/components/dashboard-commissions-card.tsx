'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import type {
  CommissionsPeriodMode,
  DashboardCommissionProfessionalRank,
} from '../types/clinic-dashboard';
import { COMMISSIONS_PERIOD_MODE_OPTIONS } from '../lib/dashboard-commissions';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import { useDashboardCommissionsQuery } from '../hooks/use-dashboard-commissions-query';
import { DashboardCommissionsDialog } from './dashboard-commissions-dialog';

function isPeriodMode(value: string): value is CommissionsPeriodMode {
  return value === 'annual' || value === 'monthly';
}

export function DashboardCommissionsCard() {
  const currentYear = new Date().getFullYear();
  const [periodMode, setPeriodMode] =
    useState<CommissionsPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [totalDialogOpen, setTotalDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] =
    useState<DashboardCommissionProfessionalRank | null>(null);

  const query = useDashboardCommissionsQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];
  const netTotal = query.data.netTotalCents;
  const triggerBreakdown = query.data.byTrigger;
  const typeBreakdown = query.data.byType;
  const ranking = query.data.ranking;

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  return (
    <>
      <Card className="gap-2 py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
          <CardTitle className="text-xl font-semibold">
            Análise das Comissões Pagas
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
                aria-label="Período das comissões"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSIONS_PERIOD_MODE_OPTIONS.map((option) => (
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
                  aria-label="Mês das comissões"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_MONTH_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={String(option.value)}
                    >
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
              <SelectTrigger className="w-24" aria-label="Ano das comissões">
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

        <CardContent className="space-y-5 px-5 pb-5">
          {query.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando comissões…
            </p>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as comissões.
            </p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-border/50 p-4 text-center">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold tabular-nums text-black">
                      {formatDashboardCurrencyFromCents(netTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total de comissões pagas
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 bg-transparent px-3 text-primary shadow-none hover:bg-transparent hover:text-primary"
                    aria-label="Ver total de comissões pagas"
                    onClick={() => setTotalDialogOpen(true)}
                  >
                    Ver
                  </Button>
                </div>

                <div className="rounded-xl border border-border/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Regras de pagamento
                  </h3>
                  <ul className="space-y-2.5">
                    {triggerBreakdown.map((item) => (
                      <li
                        key={item.key}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 text-sm"
                      >
                        <span className="min-w-0 truncate text-black">
                          {item.label}
                        </span>
                        <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-primary/15 px-2 font-medium tabular-nums text-primary">
                          {`${item.percent.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}%`}
                        </span>
                        <span className="min-w-24 text-right tabular-nums text-black">
                          {formatDashboardCurrencyFromCents(item.grossCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Tipos de pagamento
                  </h3>
                  <ul className="space-y-2.5">
                    {typeBreakdown.map((item) => (
                      <li
                        key={item.key}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 text-sm"
                      >
                        <span className="min-w-0 truncate text-black">
                          {item.label}
                        </span>
                        <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-primary/15 px-2 font-medium tabular-nums text-primary">
                          {`${item.percent.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}%`}
                        </span>
                        <span className="min-w-24 text-right tabular-nums text-black">
                          {formatDashboardCurrencyFromCents(item.grossCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <section
                className="space-y-2"
                aria-labelledby="commissions-ranking-title"
              >
                <h3
                  id="commissions-ranking-title"
                  className="text-lg font-semibold"
                >
                  Ranking de Profissionais
                </h3>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {`${ranking.length} ${ranking.length === 1 ? 'profissional' : 'profissionais'} com comissões pagas`}
                </p>
                {ranking.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma comissão no período selecionado.
                  </p>
                ) : (
                  ranking.map((item) => (
                    <div
                      key={item.professionalId}
                      className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.professionalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {`${item.count} ${item.count === 1 ? 'comissão' : 'comissões'}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatDashboardCurrencyFromCents(item.netCents)}
                        </p>
                      </div>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ações de ${item.professionalName}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setSelectedProfessional(item)}
                          >
                            Ver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <DashboardCommissionsDialog
        open={totalDialogOpen}
        onOpenChange={setTotalDialogOpen}
      />

      <DashboardCommissionsDialog
        open={selectedProfessional != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedProfessional(null);
        }}
        professionalId={selectedProfessional?.professionalId}
        professionalName={selectedProfessional?.professionalName}
      />
    </>
  );
}
