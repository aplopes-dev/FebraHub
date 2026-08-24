"use client";

import { PageHeader } from "@citybox/ui/organisms";
import { GatewayStats } from "@/features/financeiro/components/gateway/gateway-stats";
import { WebhookLogsTable } from "@/features/financeiro/components/gateway/webhook-logs-table";

export default function GatewayPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Gateway"
        description="Logs de eventos do gateway de pagamento"
      />
      <GatewayStats />
      <WebhookLogsTable />
    </div>
  );
}
