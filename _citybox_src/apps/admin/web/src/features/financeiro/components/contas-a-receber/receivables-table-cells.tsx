"use client";

import { FileText, QrCode, CreditCard } from "lucide-react";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { Invoice, InvoiceStatus, PaymentMethod } from "../../types";
import {
  invoiceStatusConfig,
  paymentMethodConfig,
} from "../../lib/receivable-status-config";

// ─── Célula: Fatura / Ref ─────────────────────────────────────────────────────

export function InvoiceCell({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium font-mono">{invoice.ref}</span>
    </div>
  );
}

// ─── Célula: Cliente ──────────────────────────────────────────────────────────

export function ClientNameCell({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-sm font-medium truncate">{invoice.clientName}</span>
      <span className="text-xs text-muted-foreground font-mono">
        {invoice.clientDocument}
      </span>
    </div>
  );
}

// ─── Célula: Vencimento ───────────────────────────────────────────────────────

export function DueDateCell({ invoice }: { invoice: Invoice }) {
  const [year, month, day] = invoice.dueDate.split("-");
  const formatted = `${day}/${month}/${year}`;

  const isOverdue = invoice.status === "PAST_DUE";
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm tabular-nums">{formatted}</span>
      {isOverdue && diffDays > 0 && (
        <span className="text-xs text-destructive">há {diffDays} dia{diffDays !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}

// ─── Célula: Valor ────────────────────────────────────────────────────────────

export function AmountCell({ amount }: { amount: number }) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return(
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-sm tabular-nums font-medium">{formatted}</span>
    </div>
  )
}

// ─── Célula: Método ───────────────────────────────────────────────────────────

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  PIX: <QrCode className="h-3 w-3" />,
  CREDIT_CARD: <CreditCard className="h-3 w-3" />,
  BOLETO: <FileText className="h-3 w-3" />,
  UNDEFINED: <FileText className="h-3 w-3" />,
};

export function MethodCell({ method }: { method: PaymentMethod }) {
  const { label } = paymentMethodConfig[method];
  return (
    <div className="flex justify-center gap-1.5 text-sm text-muted-foreground">
      <span>{methodIcons[method]}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Célula: Status ───────────────────────────────────────────────────────────

export function InvoiceStatusCell({ status }: { status: InvoiceStatus }) {
  const { label, className } = invoiceStatusConfig[status];
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <Badge variant="outline" className={cn("w-fit text-xs font-medium", className)}>
        {label}
      </Badge>
    </div>

  );
}
