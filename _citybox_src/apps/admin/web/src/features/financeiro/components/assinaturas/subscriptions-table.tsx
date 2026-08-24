"use client";

import { useMemo } from "react";
import { DataTable } from "@citybox/ui/organisms";
import type { FilterValues, CheckboxFilterValue } from "@citybox/ui/organisms";
import { getSubscriptionsColumns } from "./subscriptions-columns";
import { useFinanceSubscriptions } from "../../hooks/use-finance-queries";
import type { SubscriptionPlan } from "../../types";

interface SubscriptionsTableProps {
  filters?: FilterValues;
}

export function SubscriptionsTable({ filters }: SubscriptionsTableProps) {
  const columns = getSubscriptionsColumns();

  const statusValues = useMemo(() => {
    if (!filters) return undefined;
    const vals = ((filters["status"] as CheckboxFilterValue) ?? []) as string[];
    const backendStatus: string[] = [];
    if (vals.includes("ativo")) {
      backendStatus.push("ACTIVE", "TRIALING");
    }
    if (vals.includes("atrasado")) {
      backendStatus.push("PAST_DUE");
    }
    if (vals.includes("cancelado")) {
      backendStatus.push("CANCELED");
    }
    return backendStatus.length > 0 ? backendStatus : undefined;
  }, [filters]);

  const { data: subsRes, isLoading } = useFinanceSubscriptions({
    status: statusValues,
    perPage: 100,
  });

  const data = useMemo(() => {
    let list = subsRes?.data || [];
    const planValues = ((filters?.["plan"] as CheckboxFilterValue) ?? []) as SubscriptionPlan[];
    if (planValues.length > 0) {
      list = list.filter((sub) => planValues.includes(sub.plan));
    }
    return list;
  }, [subsRes, filters]);

  if (isLoading) {
    return <div className="h-48 bg-muted/40 animate-pulse rounded-lg" />;
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={10}
      entityName="assinaturas"
    />
  );
}
