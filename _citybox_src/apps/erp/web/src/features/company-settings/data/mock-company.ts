import type { AddressInfo, CompanySettings, PlanInfo } from "../types/company";

export const MOCK_PLAN_INFO: PlanInfo = {
  name: "Plano Ouro (SaaS)",
  status: "active",
  expiresAt: "2027-07-28T00:00:00.000Z",
  price: 299.9,
  usersUsed: 6,
  usersLimit: 10,
  nfeUsed: 350,
  nfeLimit: 1000,
  diskUsedGb: 4.2,
  diskLimitGb: 10,
};

export const EMPTY_ADDRESS: AddressInfo = {
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  complement: "",
};

/** Baseline vazio até o GET `/v1/organizations/current` hidratar o formulário. */
export const EMPTY_COMPANY_SETTINGS: CompanySettings = {
  companyCode: "",
  personType: "PJ",
  legalName: "",
  tradeName: "",
  cnpj: "",
  email: "",
  segment: "",
  phone: "",
  foundationDate: "",
  cnae: "",
  logoUrl: null,
  address: { ...EMPTY_ADDRESS },
  financeContact: {
    name: "",
    email: "",
    phone: "",
  },
  ownerContact: {
    name: "",
    document: "",
    email: "",
    phone: "",
    mobile: "",
  },
  billing: {
    overrideEnabled: false,
    personType: "juridica",
    legalName: "",
    document: "",
    useCustomAddress: false,
    address: { ...EMPTY_ADDRESS },
  },
  usage: {
    defaultStockSale: "",
    defaultStockPurchase: "",
    defaultPriceListSale: "",
    defaultPriceListPdv: "",
    defaultPriceListService: "",
    defaultPriceListReports: "",
    adminPassword: "",
  },
  certificate: {
    fileName: null,
    password: undefined,
    expiryDate: null,
  },
};

/** @deprecated Use EMPTY_COMPANY_SETTINGS — mantido só para imports legados. */
export const INITIAL_COMPANY_SETTINGS = EMPTY_COMPANY_SETTINGS;
