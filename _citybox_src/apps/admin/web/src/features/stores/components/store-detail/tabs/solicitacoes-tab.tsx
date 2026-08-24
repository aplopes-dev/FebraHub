"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import { DataTable, EmptyState } from "@citybox/ui/organisms";
import { formatCurrency } from "@/lib/format-currency";
import {
  useCancelSignaturePackageRequestMutation,
  useLiberateSignaturePackageRequestMutation,
  useSignaturePackageRequestsQuery,
} from "../../../hooks/use-signature-package-requests-query";
import type { SignaturePackageRequest } from "../../../types";

interface SolicitacoesTabProps {
  storeId: string;
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}

function statusLabel(status: SignaturePackageRequest["status"]): string {
  if (status === "liberado") return "Liberado";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

function statusBadgeClass(status: SignaturePackageRequest["status"]): string {
  if (status === "liberado") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (status === "cancelado") {
    return "border-border bg-muted text-muted-foreground";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

/** Aba Clínica: solicitações de pacotes de assinatura eletrônica (API-backed). */
export function SolicitacoesTab({ storeId }: SolicitacoesTabProps) {
  const { requests, isPending, error } =
    useSignaturePackageRequestsQuery(storeId);
  const liberateMutation = useLiberateSignaturePackageRequestMutation(storeId);
  const cancelMutation = useCancelSignaturePackageRequestMutation(storeId);
  const actionPending =
    liberateMutation.isPending || cancelMutation.isPending;

  const columns = useMemo<ColumnDef<SignaturePackageRequest>[]>(
    () => [
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: () => <div className="text-center">Data</div>,
        cell: ({ row }) => (
          <div className="text-center tabular-nums text-sm text-foreground">
            {formatCreatedAt(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "package",
        accessorKey: "quantity",
        header: () => <div className="text-center">Pacote</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm text-foreground">
            {row.original.quantity} assinaturas
          </div>
        ),
      },
      {
        id: "price",
        accessorKey: "priceCents",
        header: () => <div className="text-center">Valor</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm tabular-nums text-foreground">
            {formatCurrency(row.original.priceCents)}
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`w-fit text-xs font-medium ${statusBadgeClass(row.original.status)}`}
            >
              {statusLabel(row.original.status)}
            </Badge>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Ações</div>,
        enableSorting: false,
        cell: ({ row }) => {
          if (row.original.status !== "pending") {
            return (
              <div className="text-center text-xs text-muted-foreground">—</div>
            );
          }
          const isLiberating =
            liberateMutation.isPending &&
            liberateMutation.variables === row.original.id;
          const isCancelling =
            cancelMutation.isPending &&
            cancelMutation.variables === row.original.id;
          return (
            <div className="flex flex-nowrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={actionPending}
                onClick={() => liberateMutation.mutate(row.original.id)}
              >
                {isLiberating ? "Liberando…" : "Liberar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={actionPending}
                onClick={() => cancelMutation.mutate(row.original.id)}
              >
                {isCancelling ? "Cancelando…" : "Cancelar"}
              </Button>
            </div>
          );
        },
      },
    ],
    [actionPending, cancelMutation, liberateMutation],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Solicitações de Assinatura Eletrônica
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pacotes solicitados pela clínica na Loja. Liberar credita o saldo no
            app da clínica.
          </p>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-sm text-muted-foreground">
              Carregando solicitações…
            </p>
          ) : error ? (
            <EmptyState
              className="rounded-lg border border-dashed"
              title="Não foi possível carregar"
              description="Tente novamente em instantes. Se o problema persistir, verifique se a clinica-api está no ar."
            />
          ) : requests.length === 0 ? (
            <EmptyState
              className="rounded-lg border border-dashed"
              title="Nenhuma solicitação"
              description="Quando a clínica solicitar um pacote, ele aparecerá aqui."
            />
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              pageSize={10}
              entityName="solicitações"
              enableSorting={false}
              paginationClassName={
                requests.length <= 10 ? "hidden" : undefined
              }
              colgroup={
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
