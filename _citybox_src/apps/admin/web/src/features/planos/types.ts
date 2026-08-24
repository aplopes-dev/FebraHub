// Tipos do domínio de Planos SaaS

export type PlanStatus = "ACTIVE" | "HIDDEN";

export type SubscriptionCycle = "MONTHLY" | "YEARLY";

export interface PlanPrice {
  id: string;
  cycle: SubscriptionCycle;
  priceCents: number;
  status: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  prices: PlanPrice[];
  vertical: string;
  tier: string;
  maxNegocios: number;
  maxUsers: number;
  maxProducts?: number | null;
  status: PlanStatus;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PlanFormMode = "create" | "edit" | "duplicate";
