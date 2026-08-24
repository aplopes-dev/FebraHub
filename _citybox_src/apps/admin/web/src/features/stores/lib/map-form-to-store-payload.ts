import type { NewStoreFormData } from '../schemas/new-store-schema';
import type { CreateStorePayload, StoreFormAddress, UpsertStorePayload } from '../types';

function buildAddress(data: NewStoreFormData): StoreFormAddress | undefined {
  const hasAddress =
    data.cep ||
    data.logradouro ||
    data.numero ||
    data.bairro ||
    data.cidade ||
    data.estado;

  if (!hasAddress) return undefined;

  return {
    zipCode: data.cep || undefined,
    street: data.logradouro || undefined,
    number: data.numero || undefined,
    complement: data.complemento || undefined,
    neighborhood: data.bairro || undefined,
    city: data.cidade || undefined,
    state: data.estado || undefined,
  };
}

export function mapFormToCreateStorePayload(data: NewStoreFormData): CreateStorePayload {
  if (data.personType !== 'PF' && data.personType !== 'PJ') {
    throw new Error('Tipo de pessoa inválido');
  }
  if (data.billingCycle !== 'MONTHLY' && data.billingCycle !== 'YEARLY') {
    throw new Error('Ciclo de faturamento inválido');
  }

  const tradeName = data.tradeName.trim();
  // PF não tem campo de razão social na UI; o ERP exige legalName no evento.
  const legalName =
    data.legalName?.trim() ||
    (data.personType === "PF" ? tradeName : undefined);

  return {
    vertical: data.vertical,
    tradeName,
    slug: data.slug,
    planId: data.planId!,
    billingCycle: data.billingCycle,
    dueDay: Number(data.dueDay),
    personType: data.personType,
    responsibleName: data.responsibleName!.trim(),
    billingEmail: data.billingEmail!.trim(),
    document: data.document!.trim(),
    legalName,
    stateRegistration: data.stateRegistration?.trim() || undefined,
    address: buildAddress(data),
    phone: data.telefone || undefined,
    timezone: data.timezone,
    ...(data.vertical === 'Clínica' && data.clinicStrand
      ? { clinicStrand: data.clinicStrand }
      : {}),
  };
}

export function mapFormToUpdateStorePayload(data: NewStoreFormData): UpsertStorePayload {
  const tradeName = data.tradeName.trim();
  const legalName =
    data.legalName?.trim() ||
    (data.personType === "PF" ? tradeName : undefined);

  return {
    tradeName,
    slug: data.slug,
    personType: data.personType || undefined,
    responsibleName: data.responsibleName?.trim() || undefined,
    billingEmail: data.billingEmail?.trim() || undefined,
    document: data.document?.trim() || undefined,
    legalName,
    stateRegistration: data.stateRegistration?.trim() || undefined,
    address: buildAddress(data),
    phone: data.telefone || undefined,
    timezone: data.timezone,
  };
}
