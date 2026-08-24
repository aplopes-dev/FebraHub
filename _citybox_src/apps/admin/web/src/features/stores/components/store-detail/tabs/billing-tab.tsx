"use client";

import { useMemo } from "react";
import { Card } from "@citybox/ui/atoms";
import { DataTable } from "@citybox/ui/organisms";
import type { LojaDetail } from "../../../types";
import { getBillingColumns } from "../billing-columns";

interface BillingTabProps {
  detail: LojaDetail;
}

export function BillingTab({ detail }: BillingTabProps) {
  const columns = useMemo(() => getBillingColumns(), []);
  const invoices = detail.billing.invoices;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Faturas
      </h3>

      {invoices.length === 0 ? (
        <Card className="p-8 flex flex-col items-center justify-center border-dashed shadow-none">
          <p className="text-sm text-muted-foreground italic">
            Nenhuma fatura registrada para esta loja.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-none">
          <div className="px-4">
            <DataTable
              columns={columns}
              data={invoices}
              pageSize={8}
              entityName="faturas"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
