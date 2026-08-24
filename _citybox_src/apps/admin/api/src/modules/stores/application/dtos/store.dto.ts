export interface StoreAddressDto {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface UpsertStoreDto {
  tradeName: string;
  slug: string;
  document?: string;
  personType?: 'PF' | 'PJ';
  responsibleName?: string;
  billingEmail?: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreAddressDto;
  phone?: string;
  timezone: string;
}

export type CreateStoreDto = UpsertStoreDto & {
  vertical: string;
  /** Só lido quando `vertical === 'Clínica'`. Ausente → odontologia. */
  clinicStrand?: string | null;
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  dueDay: number;
};

export interface UpdateStoreDto extends UpsertStoreDto {
  id: string;
  actor: string;
  /** Imutável (FR-006) — se enviado, precisa bater com o valor atual da loja; se omitido, é ignorado. */
  vertical?: string;
}

export interface FindStoreByIdDto {
  id: string;
}

export interface BlockStoreDto {
  id: string;
  actor: string;
}
