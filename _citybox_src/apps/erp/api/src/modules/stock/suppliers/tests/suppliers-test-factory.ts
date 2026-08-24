import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import { InMemoryBranchRepository } from '../../../tenancy/tests/in-memory-branch.repository';
import {
  makeCnpj,
  ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { Supplier } from '../domain/entities/supplier.entity';
import { InMemorySupplierRepository } from './in-memory-supplier.repository';

// O validador exige uuid em `organizationId`/`branchIds` — ids inventados como
// "sup-1" reprovam antes de o teste chegar na regra.
export const SUPPLIER_ID = '99999999-9999-4999-8999-999999999999';
export const OTHER_SUPPLIER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/** CPF válido — o validador confere dígito verificador. */
export const SUPPLIER_CPF = '52998224725';

export const SUPPLIER_DOCUMENT = makeCnpj(10);

type SupplierOverrides = Partial<{
  id: string;
  organizationId: string;
  personType: PersonTypeValue;
  name: string;
  legalName: string | null;
  document: string;
  stateRegistration: string | null;
  stateExempt: boolean;
  branchIds: string[];
  deletedAt: Date | null;
}>;

export function makeSupplier(overrides: SupplierOverrides = {}): Supplier {
  return Supplier.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      personType: overrides.personType ?? 'PJ',
      name: overrides.name ?? 'Distribuidora Bahia',
      legalName: overrides.legalName ?? 'Distribuidora Bahia de Alimentos Ltda',
      document: overrides.document ?? SUPPLIER_DOCUMENT,
      stateRegistration: overrides.stateRegistration ?? '987654321',
      stateExempt: overrides.stateExempt ?? false,
      municipalRegistration: '556677',
      sufamaRegistration: null,
      foundationDate: new Date('2010-03-15T00:00:00.000Z'),
      note: 'Fornecedor principal de bebidas.',
      email: 'vendas@distbahia.com.br',
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
    overrides.id ?? SUPPLIER_ID,
  );
}

/** Repositórios in-memory já ligados — fornecedores e as unidades da tenancy. */
export function makeRepositories() {
  return {
    supplierRepository: new InMemorySupplierRepository(),
    branchRepository: new InMemoryBranchRepository(),
  };
}
