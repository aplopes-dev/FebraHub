import type { ServiceOrderStatus } from "@/features/service-orders/types/service-order-status";

/** 8 status default do fluxo canônico — personalizáveis via "Gerenciar status". */
export const MOCK_SERVICE_ORDER_STATUSES: ServiceOrderStatus[] = [
  {
    id: "sos-open",
    name: "Aberta",
    baseType: "open",
    variant: "outline",
    active: true,
    sortOrder: 0,
  },
  {
    id: "sos-analysis",
    name: "Em análise",
    baseType: "in_progress",
    variant: "secondary",
    active: true,
    sortOrder: 1,
  },
  {
    id: "sos-awaiting-approval",
    name: "Aguardando aprovação",
    baseType: "in_progress",
    variant: "secondary",
    active: true,
    sortOrder: 2,
  },
  {
    id: "sos-awaiting-part",
    name: "Aguardando peça",
    baseType: "in_progress",
    variant: "secondary",
    active: true,
    sortOrder: 3,
  },
  {
    id: "sos-in-progress",
    name: "Em execução",
    baseType: "in_progress",
    variant: "default",
    active: true,
    sortOrder: 4,
  },
  {
    id: "sos-ready",
    name: "Pronta para retirada",
    baseType: "ready",
    variant: "default",
    active: true,
    sortOrder: 5,
  },
  {
    id: "sos-closed",
    name: "Concluída",
    baseType: "closed",
    variant: "secondary",
    active: true,
    sortOrder: 6,
  },
  {
    id: "sos-canceled",
    name: "Cancelada",
    baseType: "canceled",
    variant: "destructive",
    active: true,
    sortOrder: 7,
  },
];
