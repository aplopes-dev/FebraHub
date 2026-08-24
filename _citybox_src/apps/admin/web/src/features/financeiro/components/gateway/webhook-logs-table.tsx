"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@citybox/ui/organisms";
import { useGatewayEvents } from "../../hooks/use-finance-queries";
import type { WebhookLog } from "../../types";
import { getWebhookLogsColumns } from "./webhook-logs-columns";
import { WebhookPayloadSheet } from "./webhook-payload-sheet";

export function WebhookLogsTable() {
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const { data: queryResult, isLoading } = useGatewayEvents({
    page: pageIndex + 1,
    perPage: pageSize,
  });

  const columns = useMemo(
    () =>
      getWebhookLogsColumns((log) => {
        setSelectedLog(log);
        setSheetOpen(true);
      }),
    [],
  );

  if (isLoading) {
    return <div className="h-48 bg-muted/40 animate-pulse rounded-lg" />;
  }

  const logs = queryResult?.data ?? [];
  const total = queryResult?.meta?.total ?? 0;
  const pageCount = queryResult?.meta?.totalPages ?? 0;

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        manualPagination={true}
        pageIndex={pageIndex}
        pageCount={pageCount}
        totalRowCount={total}
        onPageIndexChange={setPageIndex}
        pageSize={pageSize}
        entityName="eventos"
      />

      <WebhookPayloadSheet
        log={selectedLog}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
