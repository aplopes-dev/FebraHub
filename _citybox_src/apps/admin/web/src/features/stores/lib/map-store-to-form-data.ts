import type { StoreFormDetail } from '../types';
import type { NewStoreFormData } from '../schemas/new-store-schema';
import { EDIT_STORE_DEFAULT_VALUES } from '../schemas/new-store-schema';

export function mapStoreToFormData(store: StoreFormDetail): NewStoreFormData {
  const address = store.address;

  return {
    ...EDIT_STORE_DEFAULT_VALUES,
    vertical: store.vertical,
    clinicStrand: store.clinicStrand ?? undefined,
    tradeName: store.tradeName,
    slug: store.slug,
    personType: store.personType ?? '',
    document: store.document ?? '',
    legalName: store.legalName ?? '',
    stateRegistration: store.stateRegistration ?? '',
    responsibleName: store.responsibleName ?? '',
    billingEmail: store.billingEmail ?? '',
    cep: address?.zipCode ?? '',
    logradouro: address?.street ?? '',
    numero: address?.number ?? '',
    complemento: address?.complement ?? '',
    bairro: address?.neighborhood ?? '',
    cidade: address?.city ?? '',
    estado: address?.state ?? '',
    telefone: store.phone ?? '',
    timezone: store.timezone,
  };
}
