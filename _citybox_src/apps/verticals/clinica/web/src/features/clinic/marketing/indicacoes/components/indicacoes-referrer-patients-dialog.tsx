'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { formatLocalDateBr } from '@/features/clinic/modules/dashboard/lib/dashboard-dates';
import { useIndicacoesReferredPatientsQuery } from '../hooks/use-indicacoes-referred-patients-query';
import {
  formatIndicacoesReferralCountLabel,
  formatIndicacoesReferrerKindLabel,
} from '../lib/format-indicacoes-referrer-kind';
import {
  DEFAULT_INDICACOES_PAGE_SIZE,
  IndicacoesPaginationBar,
  type IndicacoesPageSize,
} from './indicacoes-pagination-bar';
import type {
  IndicacoesPeriodMode,
  IndicacoesReferrerKind,
} from '../types/indicacoes';

type IndicacoesReferrerPatientsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referrerId: string;
  referrerName: string;
  referrerKind: IndicacoesReferrerKind;
  periodMode: IndicacoesPeriodMode;
  year: number;
  month: number;
  totalReferrals: number;
};

export function IndicacoesReferrerPatientsDialog({
  open,
  onOpenChange,
  referrerId,
  referrerName,
  referrerKind,
  periodMode,
  year,
  month,
  totalReferrals,
}: IndicacoesReferrerPatientsDialogProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<IndicacoesPageSize>(
    DEFAULT_INDICACOES_PAGE_SIZE,
  );

  useEffect(() => {
    if (!open) {
      setPage(1);
      setPageSize(DEFAULT_INDICACOES_PAGE_SIZE);
    }
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, referrerId, periodMode, year, month]);

  const query = useIndicacoesReferredPatientsQuery(
    {
      periodMode,
      year,
      month: periodMode === 'monthly' ? month : undefined,
      page,
      perPage: pageSize,
      sortOrder: 'desc',
      referrerKind,
      referrerId,
    },
    open,
  );

  const rows = query.data?.items ?? [];
  const meta = query.data?.meta;
  const total = meta?.total ?? totalReferrals;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,40rem)] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>Pacientes indicados</DialogTitle>
          <DialogDescription>
            {referrerName} · {formatIndicacoesReferrerKindLabel(referrerKind)} ·{' '}
            {formatIndicacoesReferralCountLabel(total)}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {query.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Carregando pacientes…
            </p>
          ) : query.isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar os pacientes indicados.
            </p>
          ) : total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum paciente indicado no período.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-max border-collapse text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b border-border/60">
                      <th className="px-3 py-2.5 text-left font-medium text-foreground">
                        Nome
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-foreground">
                        Telefone
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-foreground">
                        Data da indicação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/40 last:border-0 even:bg-muted/30"
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 text-foreground">
                          {row.phone || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-foreground">
                          {formatLocalDateBr(row.referralDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <IndicacoesPaginationBar
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                entitySingular="paciente"
                entityPlural="pacientes"
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
