export type KdsStatus = "active" | "inactive";

export type Kds = {
  id: string;
  name: string;
  status: KdsStatus;
  /**
   * Tela de expedição: além de preparar, este KDS confere e libera o pedido
   * para entrega/retirada.
   */
  isExpedition: boolean;
  /** Produtos que este KDS prepara. */
  productIds: string[];
  deletedAt: string | null;
};

export type KdsFormValues = {
  name: string;
  status: KdsStatus;
  isExpedition: boolean;
};

export type KdsListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type KdsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type KdsListResult = {
  data: Kds[];
  meta: KdsListMeta;
};

export const KDS_STATUS_LABELS: Record<KdsStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export function createEmptyKdsFormValues(): KdsFormValues {
  return {
    name: "",
    status: "active",
    isExpedition: false,
  };
}

export function kdsToFormValues(kds: Kds): KdsFormValues {
  return {
    name: kds.name,
    status: kds.status,
    isExpedition: kds.isExpedition,
  };
}
