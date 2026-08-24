export type PersonType = "juridica" | "fisica";

export type SupplierListTab = "active" | "deleted";

export type SupplierContact = {
  email: string;
  commercialPhone: string;
  mobilePhone: string;
};

export type SupplierAddress = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

export type Supplier = {
  id: string;
  personType: PersonType;
  /** Nome do fornecedor. */
  name: string;
  /** Razão social. */
  legalName: string;
  /** CNPJ (PJ) ou CPF (PF). */
  document: string;
  stateRegistration: string;
  stateExempt: boolean;
  municipalRegistration: string;
  /** Inscrição SUFRAMA. */
  sufamaRegistration: string;
  /** Data de fundação (yyyy-mm-dd) ou "". */
  foundationDate: string;
  unitIds: string[];
  note: string;
  contact: SupplierContact;
  address: SupplierAddress;
  deletedAt: string | null;
};

export type SupplierFormValues = Omit<Supplier, "id" | "deletedAt">;

export type SupplierTabCounts = Record<SupplierListTab, number>;

export type SupplierListParams = {
  tab: SupplierListTab;
  search: string;
  page: number;
  perPage: number;
};

export type SupplierListResult = {
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: SupplierTabCounts;
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  juridica: "Pessoa jurídica",
  fisica: "Pessoa física",
};

export const SUPPLIER_TAB_LABELS: Record<SupplierListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export const SUPPLIER_TAB_ORDER: SupplierListTab[] = ["active", "deleted"];

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
