"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Subscription } from "../../types";
import {
  SubscriptionClientCell,
  PlanCell,
  CycleCell,
  MrrCell,
  RenewalCell,
  SubscriptionStatusCell,
} from "./subscriptions-table-cells";
import { SubscriptionsActionsMenu } from "./subscriptions-actions-menu";

export function getSubscriptionsColumns(): ColumnDef<Subscription>[] {
  return [
    {
      id: "cliente",
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => (
        <SubscriptionClientCell subscription={row.original} />
      ),
    },
    {
      id: "plano",
      accessorKey: "plan",
      header: "Plano Atual",
      cell: ({ row }) => <PlanCell plan={row.original.plan} />,
    },
    {
      id: "ciclo",
      accessorKey: "cycle",
      header: "Ciclo",
      cell: ({ row }) => <CycleCell cycle={row.original.cycle} />,
    },
    {
      id: "mrr",
      accessorKey: "mrr",
      header: "MRR",
      cell: ({ row }) => <MrrCell mrr={row.original.mrr} />,
    },
    {
      id: "renovacao",
      accessorKey: "nextRenewal",
      header: "Próxima Renovação",
      cell: ({ row }) => <RenewalCell subscription={row.original} />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <SubscriptionStatusCell status={row.original.status} />
      ),
    },
    {
      id: "acoes",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <SubscriptionsActionsMenu subscription={row.original} />
        </div>
      ),
    },
  ];
}
