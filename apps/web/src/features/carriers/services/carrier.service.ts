import type {
  Carrier,
  CarrierFormValues,
} from "@/features/carriers/types/carrier";

/**
 * Só os helpers puros do formulário. O CRUD vive em
 * `features/carriers/api/carriers.service.ts` (React Query + `apiFetch`).
 */
export function createEmptyCarrierFormValues(): CarrierFormValues {
  return {
    personType: "juridica",
    deliveryType: "transportadora",
    tradeName: "",
    legalName: "",
    document: "",
    fiscal: {
      icmsExempt: false,
      registerInNfe: false,
      noStateRegistration: false,
      stateRegistration: "",
      municipalRegistration: "",
    },
    unitIds: [],
    contact: {
      email: "",
      commercialPhone: "",
      mobilePhone: "",
      additionalPhone: "",
    },
    address: {
      zipCode: "",
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      complement: "",
    },
  };
}

export function carrierToFormValues(carrier: Carrier): CarrierFormValues {
  return {
    personType: carrier.personType,
    deliveryType: carrier.deliveryType,
    tradeName: carrier.tradeName,
    legalName: carrier.legalName,
    document: carrier.document,
    fiscal: { ...carrier.fiscal },
    unitIds: [...carrier.unitIds],
    contact: { ...carrier.contact },
    address: { ...carrier.address },
  };
}
