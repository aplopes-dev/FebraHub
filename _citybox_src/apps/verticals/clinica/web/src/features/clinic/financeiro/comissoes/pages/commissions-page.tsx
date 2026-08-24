'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@citybox/ui/atoms';
import { useStore } from '@/lib/store-context';
import { useTeamMembers } from '@/features/shared/team';
import { useCommissionFilters } from '../hooks/use-commission-filters';
import {
  useCommissionHistoryQuery,
  useCreateCommissionPaymentMutation,
  useOpenCommissionsQuery,
} from '../hooks/use-commissions-queries';
import { CommissionPeriodSelect } from '../components/commission-period-select';
import { ProfessionalSearchInput } from '../components/professional-search-input';
import { CommissionsOpenTable } from '../components/commissions-open-table';
import { CommissionsHistoryTable } from '../components/commissions-history-table';
import { CommissionDetailsDialog } from '../components/commission-details-dialog';
import { CommissionPayDialog } from '../components/commission-pay-dialog';
import { CommissionSuccessDialog } from '../components/commission-success-dialog';
import { useFinancialPermissions } from '../../hooks/use-financial-permissions';
import type {
  CommissionPayFormValues,
  CommissionSummaryRow,
} from '../types/commission-financial.types';

function mergeOpenWithTeamMembers(
  apiRows: CommissionSummaryRow[],
  members: Array<{ id: string; name: string }>,
  selectedProfessionalId: string | null,
  searchForApi: string | undefined,
): CommissionSummaryRow[] {
  const byId = new Map(apiRows.map((row) => [row.professionalId, row]));

  for (const member of members) {
    if (byId.has(member.id)) continue;
    if (selectedProfessionalId && member.id !== selectedProfessionalId) continue;
    if (searchForApi) {
      const lower = searchForApi.toLowerCase();
      if (!member.name.toLowerCase().includes(lower)) continue;
    }
    byId.set(member.id, {
      professionalId: member.id,
      professionalName: member.name,
      totalCents: 0,
      hasCommissionConfigured: false,
      ruleGroups: [],
    });
  }

  return [...byId.values()].sort((a, b) =>
    a.professionalName.localeCompare(b.professionalName, 'pt-BR'),
  );
}

export function ClinicCommissionsPage() {
  const { memberId } = useStore();
  const { members, isLoading: isTeamLoading } = useTeamMembers();
  const { canCommissionPay, canCommissionAll } = useFinancialPermissions();

  const professionals = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.name })),
    [members],
  );

  const {
    period,
    customStart,
    customEnd,
    periodRange,
    professionalSearch,
    searchForApi,
    selectedProfessionalId,
    selectedProfessionalName,
    professionalSuggestions,
    handlePeriodChange,
    handleSearchChange,
    handleSelectProfessional,
    handleClearProfessional,
    handleCustomStartChange,
    handleCustomEndChange,
  } = useCommissionFilters({ professionals });

  const listParams = useMemo(
    () => ({
      page: 1,
      perPage: 100,
      startDate: periodRange.startDate,
      endDate: periodRange.endDate,
      professionalId: canCommissionAll
        ? (selectedProfessionalId ?? undefined)
        : (memberId ?? undefined),
      search: canCommissionAll ? searchForApi : undefined,
    }),
    [
      periodRange,
      selectedProfessionalId,
      searchForApi,
      canCommissionAll,
      memberId,
    ],
  );

  const openQuery = useOpenCommissionsQuery(listParams, {
    enabled: canCommissionAll || Boolean(memberId),
  });
  const historyQuery = useCommissionHistoryQuery(listParams, {
    enabled: canCommissionAll || Boolean(memberId),
  });
  const payMutation = useCreateCommissionPaymentMutation();

  const openRows = useMemo(() => {
    const apiRows = openQuery.data?.data ?? [];
    if (!canCommissionAll) {
      // Sempre mostra a própria linha (mesmo com R$ 0 / sem regras).
      const selfFromTeam = memberId
        ? professionals.filter((member) => member.id === memberId)
        : [];
      const selfMembers =
        selfFromTeam.length > 0
          ? selfFromTeam
          : memberId
            ? [{ id: memberId, name: 'Você' }]
            : [];
      return mergeOpenWithTeamMembers(
        apiRows,
        selfMembers,
        memberId ?? null,
        undefined,
      );
    }
    return mergeOpenWithTeamMembers(
      apiRows,
      professionals,
      selectedProfessionalId,
      searchForApi,
    );
  }, [
    openQuery.data?.data,
    professionals,
    selectedProfessionalId,
    searchForApi,
    canCommissionAll,
    memberId,
  ]);

  const historyRows = historyQuery.data?.data ?? [];

  const [detailsRow, setDetailsRow] = useState<CommissionSummaryRow | null>(null);
  const [detailsMode, setDetailsMode] = useState<'open' | 'history'>('open');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [payRow, setPayRow] = useState<CommissionSummaryRow | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);

  const [successName, setSuccessName] = useState('');
  const [successValueCents, setSuccessValueCents] = useState(0);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleOpenDetails = useCallback((row: CommissionSummaryRow) => {
    setDetailsRow(row);
    setDetailsMode('open');
    setIsDetailsOpen(true);
  }, []);

  const handleHistoryDetails = useCallback((row: CommissionSummaryRow) => {
    setDetailsRow(row);
    setDetailsMode('history');
    setIsDetailsOpen(true);
  }, []);

  const handleOpenPay = useCallback((row: CommissionSummaryRow) => {
    setPayRow(row);
    setIsPayOpen(true);
  }, []);

  const handleConfirmPay = useCallback(
    async (values: CommissionPayFormValues) => {
      if (!payRow) return;
      try {
        const result = await payMutation.mutateAsync({ row: payRow, values });
        setIsPayOpen(false);
        setPayRow(null);
        setSuccessName(result.memberName || payRow.professionalName);
        setSuccessValueCents(result.netCents);
        setIsSuccessOpen(true);
      } catch {
        // Toast no onError da mutation.
      }
    },
    [payMutation, payRow],
  );

  const isOpenLoading =
    openQuery.isLoading || (!canCommissionAll && isTeamLoading);
  const isHistoryLoading = historyQuery.isLoading;
  const openError = openQuery.isError;
  const historyError = historyQuery.isError;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CommissionPeriodSelect
          value={period}
          onChange={handlePeriodChange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={handleCustomStartChange}
          onCustomEndChange={handleCustomEndChange}
        />
        {canCommissionAll ? (
          <ProfessionalSearchInput
            value={professionalSearch}
            onChange={handleSearchChange}
            suggestions={professionalSuggestions}
            onSelect={handleSelectProfessional}
            selectedName={selectedProfessionalName || undefined}
            onClear={handleClearProfessional}
          />
        ) : null}
      </div>

      <Tabs defaultValue="open" className="flex flex-col gap-4">
        <TabsList className="h-10 w-full justify-start rounded-xl bg-muted p-1">
          <TabsTrigger value="open" className="flex-none rounded-lg px-4">
            Em aberto
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-none rounded-lg px-4">
            Histórico de pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-0">
          {isOpenLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando comissões…
            </div>
          ) : openError ? (
            <div className="rounded-lg border border-destructive/40 px-4 py-8 text-center text-sm text-destructive">
              Não foi possível carregar as comissões em aberto.
            </div>
          ) : (
            <CommissionsOpenTable
              rows={openRows}
              periodRange={periodRange}
              onDetails={handleOpenDetails}
              showTeamLinks={canCommissionAll}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {isHistoryLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando histórico…
            </div>
          ) : historyError ? (
            <div className="rounded-lg border border-destructive/40 px-4 py-8 text-center text-sm text-destructive">
              Não foi possível carregar o histórico de pagamentos.
            </div>
          ) : (
            <CommissionsHistoryTable
              rows={historyRows}
              periodRange={periodRange}
              onDetails={handleHistoryDetails}
            />
          )}
        </TabsContent>
      </Tabs>

      <CommissionDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        row={detailsRow}
        mode={detailsMode}
        initialPeriod={period}
        initialCustomStart={customStart}
        initialCustomEnd={customEnd}
        onPay={
          canCommissionPay
            ? (rowToPay) => {
                setIsDetailsOpen(false);
                handleOpenPay(rowToPay);
              }
            : undefined
        }
      />

      <CommissionPayDialog
        open={isPayOpen}
        onOpenChange={setIsPayOpen}
        row={payRow}
        onConfirm={handleConfirmPay}
        isSubmitting={payMutation.isPending}
      />

      <CommissionSuccessDialog
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        professionalName={successName}
        paidValueCents={successValueCents}
      />
    </div>
  );
}
