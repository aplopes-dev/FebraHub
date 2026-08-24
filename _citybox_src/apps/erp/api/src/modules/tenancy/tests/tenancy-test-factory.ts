import type { MembershipRoleValue } from '../../../shared/infra/tenancy/tenant-context';
import type { PersonTypeValue } from '../../../shared/core/utils/document';
import { Branch, type TaxRegimeValue } from '../domain/entities/branch.entity';
import { Membership } from '../domain/entities/membership.entity';
import { Organization } from '../domain/entities/organization.entity';
import { User } from '../domain/entities/user.entity';
import { FakeIdentityProvider } from './fake-identity.provider';
import { InMemoryBranchRepository } from './in-memory-branch.repository';
import { InMemoryMembershipRepository } from './in-memory-membership.repository';
import { InMemoryOrganizationRepository } from './in-memory-organization.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';

// O validador da unidade exige `organizationId` no formato uuid — ids
// inventados como "org-1" reprovam antes de o teste chegar na regra.
export const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
export const BRANCH_ID = '33333333-3333-4333-8333-333333333333';
export const OTHER_BRANCH_ID = '44444444-4444-4444-8444-444444444444';
export const USER_ID = '55555555-5555-4555-8555-555555555555';
export const OWNER_USER_ID = '66666666-6666-4666-8666-666666666666';
export const MEMBERSHIP_ID = '77777777-7777-4777-8777-777777777777';
export const OWNER_MEMBERSHIP_ID = '88888888-8888-4888-8888-888888888888';

/** CPF válido — os validators conferem dígito verificador. */
export const RESPONSIBLE_CPF = '52998224725';

const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function checkDigit(digits: readonly number[], weights: readonly number[]) {
  const sum = digits.reduce(
    (total, digit, index) => total + digit * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Gera CNPJs válidos em série. Documento inventado reprova no dígito
 * verificador, então cada unidade de um teste de listagem precisa de um CNPJ
 * calculado, não sorteado.
 */
export function makeCnpj(sequence = 0): string {
  const base = `${11222333 + sequence}0001`;
  const digits = [...base].map(Number);
  const first = checkDigit(digits, CNPJ_FIRST_WEIGHTS);
  const second = checkDigit([...digits, first], CNPJ_SECOND_WEIGHTS);
  return `${base}${first}${second}`;
}

export const ORGANIZATION_DOCUMENT = makeCnpj(0);
export const BRANCH_DOCUMENT = makeCnpj(1);

type OrganizationOverrides = Partial<{
  id: string;
  personType: PersonTypeValue;
  document: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  platformStoreId: string | null;
}>;

export function makeOrganization(
  overrides: OrganizationOverrides = {},
): Organization {
  return Organization.create(
    {
      personType: overrides.personType ?? 'PJ',
      document: overrides.document ?? ORGANIZATION_DOCUMENT,
      legalName: overrides.legalName ?? 'Comércio Ilhéus Ltda',
      tradeName: overrides.tradeName ?? 'Loja Ilhéus',
      email: overrides.email ?? 'contato@lojailheus.com.br',
      phone: '7332310000',
      responsibleName: 'Maria Souza',
      responsibleDocument: RESPONSIBLE_CPF,
      responsibleEmail: 'maria@lojailheus.com.br',
      responsiblePhone: '73991110000',
      platformStoreId: overrides.platformStoreId ?? null,
    },
    overrides.id ?? ORGANIZATION_ID,
  );
}

type BranchOverrides = Partial<{
  id: string;
  organizationId: string;
  code: string;
  document: string;
  legalName: string;
  tradeName: string | null;
  taxRegime: TaxRegimeValue;
  isHeadquarters: boolean;
  active: boolean;
  deletedAt: Date | null;
}>;

export function makeBranch(overrides: BranchOverrides = {}): Branch {
  return Branch.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      code: overrides.code ?? '001',
      personType: 'PJ',
      document: overrides.document ?? BRANCH_DOCUMENT,
      legalName: overrides.legalName ?? 'Comércio Ilhéus Ltda',
      tradeName: overrides.tradeName ?? 'Loja Centro',
      stateRegistration: null,
      municipalRegistration: null,
      taxRegime: overrides.taxRegime ?? 'SIMPLES_NACIONAL',
      isHeadquarters: overrides.isHeadquarters ?? false,
      zipCode: '45650000',
      street: 'Rua do Comércio',
      number: '100',
      complement: null,
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
      phone: '7332310000',
      email: 'centro@lojailheus.com.br',
      timezone: 'America/Bahia',
      active: overrides.active ?? true,
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? BRANCH_ID,
  );
}

type UserOverrides = Partial<{
  id: string;
  keycloakSub: string;
  email: string | null;
  name: string | null;
  active: boolean;
}>;

export function makeUser(overrides: UserOverrides = {}): User {
  return User.create(
    {
      keycloakSub: overrides.keycloakSub ?? 'keycloak-seed-user',
      email: overrides.email ?? 'joao@lojailheus.com.br',
      name: overrides.name ?? 'João Silva',
      avatarUrl: null,
      active: overrides.active ?? true,
    },
    overrides.id ?? USER_ID,
  );
}

type MembershipOverrides = Partial<{
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRoleValue;
  permissionProfileId: string | null;
  active: boolean;
  pdvCode: string | null;
  pdvPinHash: string | null;
  pdvPinUpdatedAt: Date | null;
  pdvFailedAttempts: number;
  pdvLockedUntil: Date | null;
}>;

export function makeMembership(
  overrides: MembershipOverrides = {},
): Membership {
  return Membership.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      userId: overrides.userId ?? USER_ID,
      role: overrides.role ?? 'MEMBER',
      permissionProfileId: overrides.permissionProfileId ?? null,
      active: overrides.active ?? true,
      pdvCode: overrides.pdvCode,
      pdvPinHash: overrides.pdvPinHash,
      pdvPinUpdatedAt: overrides.pdvPinUpdatedAt,
      pdvFailedAttempts: overrides.pdvFailedAttempts,
      pdvLockedUntil: overrides.pdvLockedUntil,
    },
    overrides.id ?? MEMBERSHIP_ID,
  );
}

/** Monta os quatro repositórios in-memory e o Keycloak falso, já ligados. */
export function makeRepositories() {
  const userRepository = new InMemoryUserRepository();
  const membershipRepository = new InMemoryMembershipRepository(userRepository);
  const branchRepository = new InMemoryBranchRepository();
  const organizationRepository = new InMemoryOrganizationRepository(
    membershipRepository,
    branchRepository,
  );
  const identityProvider = new FakeIdentityProvider();

  return {
    userRepository,
    membershipRepository,
    branchRepository,
    organizationRepository,
    identityProvider,

    /**
     * Cria a pessoa e o vínculo dela numa tacada — o par mais repetido.
     *
     * Arrow function e não método: os testes desestruturam este helper, e um
     * método solto do objeto perde o `this` (regra `unbound-method`).
     */
    seedMember: async (
      overrides: {
        user?: UserOverrides;
        membership?: MembershipOverrides;
        branchIds?: string[];
      } = {},
    ) => {
      const user = await userRepository.save(makeUser(overrides.user));
      const membership = await membershipRepository.save(
        makeMembership({ userId: user.id, ...overrides.membership }),
      );
      if (overrides.branchIds?.length) {
        await membershipRepository.replaceBranchAccess(
          membership.organizationId,
          membership.id,
          overrides.branchIds,
        );
      }
      return { user, membership };
    },

    /** Responsável ativo — evita esbarrar na regra do último OWNER. */
    seedOwner: async () => {
      const user = await userRepository.save(
        makeUser({
          id: OWNER_USER_ID,
          keycloakSub: 'keycloak-seed-owner',
          email: 'maria@lojailheus.com.br',
          name: 'Maria Souza',
        }),
      );
      const membership = await membershipRepository.save(
        makeMembership({
          id: OWNER_MEMBERSHIP_ID,
          userId: user.id,
          role: 'OWNER',
        }),
      );
      return { user, membership };
    },
  };
}
