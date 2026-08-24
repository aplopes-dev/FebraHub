"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { paymentMethodLabel } from "../lib/payment-method-labels";
import type { PaymentMethodSummary } from "../types";

interface TransactionsByMethodTableProps {
  rows: PaymentMethodSummary[];
  onView?: (method: string) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TransactionsByMethodTable({
  rows,
  onView,
}: TransactionsByMethodTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meio de pagamento</TableHead>
            <TableHead className="text-right">Receitas</TableHead>
            <TableHead className="text-right">Despesas</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="w-24 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.method}>
                <TableCell className="font-medium">
                  {paymentMethodLabel(row.method)}
                </TableCell>
                <TableCell className="text-right text-green-700 tabular-nums">
                  {formatCurrency(row.income)}
                </TableCell>
                <TableCell className="text-right text-red-700 tabular-nums">
                  {formatCurrency(row.expense)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    row.balance >= 0 ? "text-green-700" : "text-red-700",
                  )}
                >
                  {formatCurrency(row.balance)}
                </TableCell>
                <TableCell className="text-right">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => onView(row.method)}
                    >
                      VER
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
