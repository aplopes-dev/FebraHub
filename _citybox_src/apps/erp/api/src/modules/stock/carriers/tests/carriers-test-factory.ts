import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import { InMemoryBranchRepository } from '../../../tenancy/tests/in-memory-branch.repository';
import {
  makeCnpj,
  ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import {
  Carrier,
  type CarrierDeliveryTypeValue,
} from '../domain/entities/carrier.entity';
import { InMemoryCarrierRepository } from './in-memory-carrier.repository';

// O validador exige uuid em `organizationId`/`branchIds` — ids inventados como
// "car-1" reprovam antes de o teste chegar na regra.
export const CARRIER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const OTHER_CARRIER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/** CPF válido — o validador confere dígito verificador. */
export const CARRIER_CPF = '39053344705';

// Sequência 20+ para não colidir com os CNPJs de `suppliers-test-factory`
// (que usa 10/11) nem com os de `tenancy-test-factory` (0/1).
export const CARRIER_DOCUMENT = makeCnpj(20);

type CarrierOverrides = Partial<{
  id: string;
  organizationId: string;
  personType: PersonTypeValue;
  deliveryType: CarrierDeliveryTypeValue;
  name: string;
  legalName: string | null;
  document: string;
  stateRegistration: string | null;
  stateExempt: boolean;
  branchIds: string[];
  deletedAt: Date | null;
}>;

export function makeCarrier(overrides: CarrierOverrides = {}): Carrier {
  return Carrier.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      personType: overrides.personType ?? 'PJ',
      deliveryType: overrides.deliveryType ?? 'transportadora',
      name: overrides.name ?? 'Transportadora Bahia',
      legalName: overrides.legalName ?? 'Transportadora Bahia Ltda',
      document: overrides.document ?? CARRIER_DOCUMENT,
      icmsExempt: false,
      registerInNfe: true,
      stateRegistration: overrides.stateRegistration ?? '987654321',
      stateExempt: overrides.stateExempt ?? false,
      municipalRegistration: '556677',
      email: 'contato@transbahia.com.br',
      commercialPhone: '7336112000',
      mobilePhone: '73991234567',
      zipCode: '45650100',
      street: 'Rua do Comércio',
      number: '340',
      complement: 'Galpão 3',
      district: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
      branchIds: overrides.branchIds ?? [],
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? CARRIER_ID,
  );
}

/** Repositórios in-memory já ligados — transportadoras e as unidades da tenancy. */
export function makeRepositories() {
  return {
    carrierRepository: new InMemoryCarrierRepository(),
    branchRepository: new InMemoryBranchRepository(),
  };
}
