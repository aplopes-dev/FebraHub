export type PersonType = "juridica" | "fisica";

export type CarrierDeliveryType = "transportadora" | "entregador";

export type CarrierListTab = "active" | "deleted";

export type CarrierFiscal = {
  icmsExempt: boolean;
  registerInNfe: boolean;
  noStateRegistration: boolean;
  stateRegistration: string;
  municipalRegistration: string;
};

export type CarrierContact = {
  email: string;
  commercialPhone: string;
  mobilePhone: string;
  additionalPhone: string;
};

export type CarrierAddress = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

export type Carrier = {
  id: string;
  personType: PersonType;
  deliveryType: CarrierDeliveryType;
  /** Nome fantasia. */
  tradeName: string;
  /** Razão social. */
  legalName: string;
  /** CNPJ (PJ) ou CPF (PF). */
  document: string;
  fiscal: CarrierFiscal;
  unitIds: string[];
  contact: CarrierContact;
  address: CarrierAddress;
  deletedAt: string | null;
};

export type CarrierFormValues = Omit<Carrier, "id" | "deletedAt">;

export type CarrierTabCounts = Record<CarrierListTab, number>;

export type CarrierListParams = {
  tab: CarrierListTab;
  search: string;
  page: number;
  perPage: number;
};

export type CarrierListResult = {
  data: Carrier[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: CarrierTabCounts;
};

/** Opção enxuta para selects de outras telas (transferências, compras). */
export type CarrierOption = {
  id: string;
  name: string;
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  juridica: "Pessoa jurídica",
  fisica: "Pessoa física",
};

export const CARRIER_DELIVERY_LABELS: Record<CarrierDeliveryType, string> = {
  transportadora: "Transportadora",
  entregador: "Entregador Delivery",
};

export const CARRIER_TAB_LABELS: Record<CarrierListTab, string> = {
  active: "Ativas",
  deleted: "Excluídas",
};

export const CARRIER_TAB_ORDER: CarrierListTab[] = ["active", "deleted"];

export function documentLabel(personType: PersonType): string {
  return personType === "juridica" ? "CNPJ" : "CPF";
}

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

/**
 * A API guarda e devolve o documento só com dígitos. Quem lê a tela espera a
 * pontuação — só que ela vale para o documento completo: enquanto o usuário
 * digita, devolvemos o que veio, sem inventar pontos em cima de um número
 * pela metade.
 */
export function formatDocument(document: string): string {
  const digits = document.replace(/\D/g, "");

  if (digits.length === CPF_LENGTH) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (digits.length === CNPJ_LENGTH) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }

  return document;
}
