import { PlatformDashboardHeader } from "@/features/dashboard/components/platform-dashboard-header";
import { PlatformStatTiles } from "@/features/dashboard/components/platform-stat-tiles";
import { PlatformPulseChart } from "@/features/dashboard/components/platform-pulse-chart";
import { PlansDistributionChart } from "@/features/dashboard/components/plans-distribution-chart";
import { ClientStatusChart } from "@/features/dashboard/components/client-status-chart";
import { StoreStatusChart } from "@/features/dashboard/components/store-status-chart";
import { VerticalsChart } from "@/features/dashboard/components/verticals-chart";
import { SubscriptionsStatusChart } from "@/features/dashboard/components/subscriptions-status-chart";
import { PlatformActivityFeed } from "@/features/dashboard/components/platform-activity-feed";
import { TopClientsPanel } from "@/features/dashboard/components/top-clients-panel";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 p-2">
      <PlatformDashboardHeader />

      <PlatformStatTiles />

      {/* Bento: gráfico principal + mix de planos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformPulseChart />
        </div>
        <PlansDistributionChart />
      </div>

      {/* Linha de gráficos analíticos */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <ClientStatusChart />
        <StoreStatusChart />
        <SubscriptionsStatusChart />
      </div>

      <VerticalsChart />

      {/* Rodapé informativo */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PlatformActivityFeed />
        <TopClientsPanel />
      </div>
    </div>
  );
}
