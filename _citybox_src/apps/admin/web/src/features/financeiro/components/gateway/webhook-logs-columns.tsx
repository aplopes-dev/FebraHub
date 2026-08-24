"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { WebhookLog } from "../../types";
import { webhookStatusConfig } from "../../lib/subscription-status-config";
import { WebhookLogActionsMenu } from "./webhook-log-actions-menu";

const webhookEventLabels: Record<string, string> = {
  PAYMENT_RECEIVED: "Pagamento Recebido",
  PAYMENT_FAILED: "Pagamento Falhou",
  SUBSCRIPTION_RENEWED: "Assinatura Renovada",
  SUBSCRIPTION_CANCELLED: "Assinatura Cancelada",
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function getWebhookLogsColumns(
  onViewPayload: (log: WebhookLog) => void,
): ColumnDef<WebhookLog>[] {
  return [
    {
      id: "timestamp",
      accessorKey: "timestamp",
      header: "Data/Hora",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatTimestamp(row.original.timestamp)}
        </span>
      ),
    },
    {
      id: "event",
      accessorKey: "event",
      header: "Evento",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {webhookEventLabels[row.original.event] ?? row.original.event}
        </span>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      id: "clientName",
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => {
        const { clientName, clientId } = row.original;
        if (!clientId) {
          return <span className="text-sm font-medium">{clientName}</span>;
        }
        return (
          <Link
            href={`/clientes/${clientId}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {clientName}
          </Link>
        );
      },
    },
    {
      id: "localStatus",
      accessorKey: "localStatus",
      header: "Status Local",
      cell: ({ row }) => {
        const { label, className } = webhookStatusConfig[row.original.localStatus];
        return (
          <Badge variant="outline" className={cn("w-fit text-xs font-medium", className)}>
            {label}
          </Badge>
        );
      },
    },
    {
      id: "acao",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <WebhookLogActionsMenu log={row.original} onViewPayload={onViewPayload} />
        </div>
      ),
    },
  ];
}
