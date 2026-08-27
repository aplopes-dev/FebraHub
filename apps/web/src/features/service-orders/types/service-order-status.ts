/**
 * Tipo-base fixo de um status de OS. As tabs da listagem e os relatórios
 * agrupam por ele — assim status personalizados nunca quebram a navegação.
 */
export type ServiceOrderStatusBaseType =
  | "open"
  | "in_progress"
  | "ready"
  | "closed"
  | "canceled";

export type ServiceOrderStatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export type ServiceOrderStatus = {
  id: string;
  name: string;
  baseType: ServiceOrderStatusBaseType;
  /** Tokens de badge (secondary, outline, destructive…). */
  variant: ServiceOrderStatusVariant;
  active: boolean;
  sortOrder: number;
};

export type ServiceOrderStatusFormValues = {
  name: string;
  baseType: ServiceOrderStatusBaseType;
  variant: ServiceOrderStatusVariant;
  active: boolean;
};

export const SERVICE_ORDER_STATUS_BASE_TYPE_LABELS: Record<
  ServiceOrderStatusBaseType,
  string
> = {
  open: "Aberta",
  in_progress: "Em andamento",
  ready: "Pronta para retirada",
  closed: "Concluída",
  canceled: "Cancelada",
};

export const SERVICE_ORDER_STATUS_BASE_TYPE_ORDER: ServiceOrderStatusBaseType[] =
  ["open", "in_progress", "ready", "closed", "canceled"];
