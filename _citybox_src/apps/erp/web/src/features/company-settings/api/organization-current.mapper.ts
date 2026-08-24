import { formatCnpj, formatCpf, formatPhone } from "@/lib/br-format";
import { EMPTY_ADDRESS } from "@/features/company-settings/data/mock-company";
import type {
  OrganizationCurrentDto,
  UpdateOrganizationCurrentPayload,
} from "@/features/company-settings/api/organization-current.dto";
import type { CompanySettings } from "@/features/company-settings/types/company";

function text(value: string | null | undefined): string {
  return value ?? "";
}

function maskDocument(document: string, personType: "PF" | "PJ"): string {
  const digits = document.replace(/\D/g, "");
  return personType === "PF" ? formatCpf(digits) : formatCnpj(digits);
}

/**
 * Preenche o formulário a partir da API.
 * Campos sem contrato (endereço, logo, CNAE, billing override, usage…)
 * ficam vazios / defaults — a UI os marca como "Em breve".
 */
export function toCompanySettingsForm(
  dto: OrganizationCurrentDto,
): CompanySettings {
  return {
    companyCode: dto.id.slice(0, 8).toUpperCase(),
    personType: dto.personType,
    legalName: dto.legalName,
    tradeName: text(dto.tradeName),
    cnpj: maskDocument(dto.document, dto.personType),
    email: dto.email,
    segment: "",
    phone: formatPhone(text(dto.phone)),
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
      name: dto.responsible.name,
      document: text(dto.responsible.document)
        ? formatCpf(text(dto.responsible.document))
        : "",
      email: text(dto.responsible.email),
      phone: formatPhone(text(dto.responsible.phone)),
      mobile: "",
    },
    billing: {
      overrideEnabled: false,
      personType: dto.personType === "PF" ? "fisica" : "juridica",
      legalName: dto.legalName,
      document: maskDocument(dto.document, dto.personType),
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
}

/** Campo em branco não vai no corpo — ver UpdateOrganizationHttpDto. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toUpdateOrganizationPayload(
  values: CompanySettings,
): UpdateOrganizationCurrentPayload {
  return {
    legalName: values.legalName.trim(),
    tradeName: optional(values.tradeName),
    email: values.email.trim(),
    phone: optional(values.phone),
    responsibleName: values.ownerContact.name.trim(),
    responsibleDocument: optional(values.ownerContact.document ?? ""),
    responsibleEmail: optional(values.ownerContact.email),
    responsiblePhone: optional(values.ownerContact.phone),
  };
}
