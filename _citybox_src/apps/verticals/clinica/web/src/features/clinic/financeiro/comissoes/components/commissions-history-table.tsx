'use client';

import { MoreHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store-context';
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

type CommissionsHistoryTableProps = {
  rows: CommissionSummaryRow[];
  periodRange: PeriodDateRange;
  onDetails: (row: CommissionSummaryRow) => void;
};

export function CommissionsHistoryTable({
  rows,
  periodRange,
  onDetails,
}: CommissionsHistoryTableProps) {
  const { storeId } = useStore();
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 py-12 text-sm text-muted-foreground">
        Nenhum pagamento de comissão registrado no período selecionado.
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
          {rows.map((row) => (
            <TableRow key={row.professionalId}>
              <TableCell className="font-medium">{row.professionalName}</TableCell>
              <TableCell className="tabular-nums">
                {formatBrl(row.paidValueCents ?? row.totalCents)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
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
                            mode: 'history',
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
                            mode: 'history',
                            periodRange,
                            storeId,
                          })
                        }
                      >
                        Imprimir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
