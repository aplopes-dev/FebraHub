import type { Lead, Person, Property, Trend } from '@/features/shared/types';

export type MetricKey = 'active-leads' | 'total-revenue' | 'active-listings' | 'total-closed';

export type DashboardModules = {
  leads: boolean;
  properties: boolean;
  transactions: boolean;
  finance: boolean;
  calendar: boolean;
};

export type DashboardMetric = {
  key: MetricKey;
  label: string;
  /** Já formatado para exibição — a formatação mora na camada de dados. */
  value: string;
  trend: Trend;
};

export type PerformancePeriod = 'monthly' | 'quarterly' | 'yearly';

export type PerformancePoint = {
  /** Rótulo curto do eixo X (Jan, Fev, …). */
  label: string;
  /** Percentual da meta atingido no período. */
  revenue: number;
  visits: number;
  /** Receita absoluta do ponto — usada no tooltip. */
  revenueAmount: number;
};

export type PerformanceSeries = {
  period: PerformancePeriod;
  points: readonly PerformancePoint[];
  /** Índice destacado por padrão no gráfico. */
  highlightedIndex: number;
  targetAmount: number;
};

export type FeaturedProperty = {
  id: string;
  name: string;
  typeLabel: string;
  /** Até 4 diferenciais do imóvel. */
  highlights: readonly string[];
  recommendedToLeads: number;
};

export type DealsSummary = {
  closed: number;
  inProgress: number;
};

export type ReminderKind =
  | 'follow-up'
  | 'visit'
  | 'signing'
  | 'other'
  | 'expiring'
  | 'new-lead'
  | 'document';

export type Reminder = {
  kind: ReminderKind;
  title: string;
  description: string;
  /** 0–100, usado no anel de progresso. */
  progress: number;
  people?: readonly Person[];
  totalPeople?: number;
  isHighlighted?: boolean;
  href?: string;
};

/** Preview do dashboard — mesmo shape HTTP do imóvel (inclui capa autenticada). */
export type ActiveListing = Property & {
  /** Paths `/v1/properties/:id/photos/:photoId`; 1ª é a capa. */
  photoUrls?: readonly string[];
};

export type ContactLead = Lead;
