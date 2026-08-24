import type { BranchDto } from "@/features/branches/api/branch.dto";
import type {
  ProvisionBuildResult,
  ProvisionCompanyPayload,
} from "../types/certificate";
import { resolveCityCodeIbge } from "@/lib/ibge-lookup";
import {
  INCOMPATIBLE_REGIME_LABEL,
  mapBranchRegimeToFiscal,
} from "./regime-map";

/**
 * Monta o payload de provisionamento do Emitente a partir da filial matriz e do
 * `platformStoreId`, ou devolve um erro de negócio dizendo o quê falta / é
 * incompatível (FR-007/008/009). Toda validação acontece **antes** de chamar a
 * API — nunca cria um Emitente incompleto nem chuta valores.
 */
export function buildProvisionPayload(input: {
  branch: BranchDto | null;
  platformStoreId: string | null;
}): ProvisionBuildResult {
  const { branch, platformStoreId } = input;

  // FR-007 — sem loja da plataforma não há como vincular o Emitente.
  if (!platformStoreId) {
    return {
      ok: false,
      message:
        "Esta loja ainda não está habilitada para a parte fiscal. O vínculo com a plataforma não foi concluído — fale com o suporte para habilitar a emissão fiscal.",
    };
  }

  if (!branch) {
    return {
      ok: false,
      message:
        "Não encontramos a filial matriz da empresa. Cadastre a filial matriz em Configurações › Unidades e filiais antes de enviar o certificado.",
      actionHref: "/configuracoes/unidades-filiais",
      actionLabel: "Ir para Unidades e filiais",
    };
  }

  // FR-008 — regime incompatível: bloqueia, não mapeia para outro.
  const taxRegime = mapBranchRegimeToFiscal(branch.taxRegime);
  if (!taxRegime) {
    const label =
      INCOMPATIBLE_REGIME_LABEL[branch.taxRegime as "MEI" | "ISENTO"] ??
      branch.taxRegime;
    return {
      ok: false,
      message: `O regime tributário da filial matriz (${label}) ainda não é suportado na emissão fiscal. Ajuste o regime no cadastro da filial matriz para Simples Nacional, Lucro Presumido ou Lucro Real.`,
      actionHref: `/configuracoes/unidades-filiais/${branch.id}`,
      actionLabel: "Editar filial matriz",
    };
  }

  const address = branch.address;

  // FR-009 — dados obrigatórios do endereço/cadastro que faltam na matriz.
  const missing: string[] = [];
  if (!address?.street) missing.push("logradouro");
  if (!address?.number) missing.push("número");
  if (!address?.neighborhood) missing.push("bairro");
  if (!address?.city) missing.push("cidade");
  if (!address?.state) missing.push("UF");
  if (!address?.zipCode) missing.push("CEP");

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Faltam dados obrigatórios no cadastro da filial matriz para criar o Emitente: ${missing.join(", ")}. Complete em Configurações › Unidades e filiais e tente novamente.`,
      actionHref: `/configuracoes/unidades-filiais/${branch.id}`,
      actionLabel: "Completar cadastro da filial matriz",
    };
  }

  // FR-009 (risco #1) — código IBGE do município.
  const cityCodeIbge = resolveCityCodeIbge(address?.city, address?.state);
  if (!cityCodeIbge) {
    return {
      ok: false,
      message: `Não foi possível determinar o código do município (${address?.city}/${address?.state}) para a emissão fiscal. Verifique a cidade no cadastro da filial matriz.`,
      actionHref: `/configuracoes/unidades-filiais/${branch.id}`,
      actionLabel: "Editar filial matriz",
    };
  }

  const payload: ProvisionCompanyPayload = {
    storeId: platformStoreId,
    cnpj: branch.document,
    legalName: branch.legalName,
    tradeName: branch.tradeName,
    stateRegistration: branch.stateRegistration,
    municipalRegistration: branch.municipalRegistration,
    taxRegime,
    cityCodeIbge,
    uf: (address?.state as string).toUpperCase(),
    address: {
      street: address?.street as string,
      number: address?.number as string,
      complement: address?.complement ?? null,
      district: address?.neighborhood as string,
      city: address?.city as string,
      zipCode: (address?.zipCode as string).replace(/\D/g, ""),
    },
    defaultEnvironment: "HOMOLOGATION",
  };

  return { ok: true, payload };
}
