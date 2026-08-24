export interface PlatformStatTile {
  id: string;
  label: string;
  value: string;
  hint: string;
  trend?: string;
  trendPositive?: boolean;
  accent: "lime" | "teal" | "ink" | "sand";
}

export interface EcosystemDataPoint {
  month: string;
  clientes: number;
  lojas: number;
  mrr: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
  fill: string;
}

export interface VerticalCount {
  vertical: string;
  lojas: number;
  clientes: number;
}

export interface SubscriptionStatusPoint {
  status: string;
  count: number;
  fill: string;
}

export interface PlatformAlert {
  id: string;
  label: string;
  value: string;
  href?: string;
  severity: "info" | "warning";
}

export interface ModuleQuickLink {
  label: string;
  href: string;
  count?: number;
}

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  module: "clientes" | "lojas" | "financeiro" | "planos" | "usuarios";
}

export interface TopClientEntry {
  id: string;
  name: string;
  storesCount: number;
  plan: string;
  status: string;
}
