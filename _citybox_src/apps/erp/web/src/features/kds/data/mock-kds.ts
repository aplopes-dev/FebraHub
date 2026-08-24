import type { Kds } from "@/features/kds/types/kds";

export const MOCK_KDS: Kds[] = [
  {
    id: "kds-cozinha",
    name: "Cozinha",
    status: "active",
    isExpedition: false,
    productIds: [],
    deletedAt: null,
  },
  {
    id: "kds-bar",
    name: "Bar",
    status: "active",
    isExpedition: false,
    productIds: [],
    deletedAt: null,
  },
  {
    id: "kds-expedicao",
    name: "Expedição",
    status: "active",
    isExpedition: true,
    productIds: [],
    deletedAt: null,
  },
];
