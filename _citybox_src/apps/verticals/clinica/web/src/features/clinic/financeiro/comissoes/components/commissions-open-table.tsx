'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store-context';
import { Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@citybox/ui/atoms';
import { buildTeamMemberCommissionHref } from '../lib/team-commission-href';
import {
  exportCommissionRowReport,
  printCommissionRowReport,
} from '../lib/commission-row-report-actions';
import type { PeriodDateRange } from '../lib/filter-commissions-by-period';
import type { CommissionSummaryRow } from '../types/commission-financial.types';

function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}

type CommissionsOpenTableProps = {
  rows: CommissionSummaryRow[];
  periodRange: PeriodDateRange;
  onDetails: (row: CommissionSummaryRow) => void;
  /** Link "Configurar" para Equipe — só com visualizar todas as comissões. */
  showTeamLinks?: boolean;
};

export function CommissionsOpenTable({
  rows,
  periodRange,
  onDetails,
  showTeamLinks = true,
}: CommissionsOpenTableProps) {
  const router = useRouter();
  const { storeId } = useStore();
  // Visibilidade do valor por profissional — oculto por padrão
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const toggleVisibility = (professionalId: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(professionalId)) {
        next.delete(professionalId);
      } else {
        next.add(professionalId);
      }
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 py-12 text-sm text-muted-foreground">
        Nenhuma comissão em aberto no período selecionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profissional</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isVisible = visibleIds.has(row.professionalId);
            const needsConfig = !row.hasCommissionConfigured;

            return (
              <TableRow key={row.professionalId}>
                <TableCell className="font-medium">{row.professionalName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {isVisible ? formatBrl(row.totalCents) : '••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(row.professionalId)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={isVisible ? 'Ocultar valor' : 'Exibir valor'}
                    >
                      {isVisible ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {needsConfig ? (
                      showTeamLinks ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              buildTeamMemberCommissionHref(row.professionalId),
                            )
                          }
                        >
                          Configurar
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sem regras
                        </span>
                      )
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onDetails(row)}
                        >
                          Detalhes
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Mais ações"
                            >
                              <MoreHorizontal className="size-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                exportCommissionRowReport({
                                  row,
                                  mode: 'open',
                                  periodRange,
                                  storeId,
                                })
                              }
                            >
                              Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                printCommissionRowReport({
                                  row,
                                  mode: 'open',
                                  periodRange,
                                  storeId,
                                })
                              }
                            >
                              Imprimir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
