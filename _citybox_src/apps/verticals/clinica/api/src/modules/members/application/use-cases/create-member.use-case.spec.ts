import type {
  KeycloakProvisioningService,
  ProvisionMemberInput,
} from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { Clinic } from '../../../tenancy/domain/entities/clinic.entity';
import { Organization } from '../../../tenancy/domain/entities/organization.entity';
import {
  InMemoryClinicRepository,
  InMemoryOrganizationRepository,
} from '../../../tenancy/tests/in-memory-tenancy.repositories';
import {
  MemberEmailTakenError,
  MemberIdentityTakenError,
  MemberUsernameTakenError,
} from '../../domain/errors/member.errors';
import { InMemoryMemberRepository } from '../../tests/in-memory-member.repository';
import { CreateMemberUseCase } from './create-member.use-case';

const STORE_ID = 'store-1';
const ORGANIZATION_ID = 'org-1';
const CLINIC_ID = 'clinic-1';

function buildKeycloakStub(options: {
  emailToSub?: Array<[string, string]>;
  usernameToSub?: Array<[string, string]>;
} = {}) {
  const emailToSub = new Map(options.emailToSub ?? []);
  const usernameToSub = new Map(options.usernameToSub ?? []);
  let sequence = 0;
  const provisioned: ProvisionMemberInput[] = [];

  const service = {
    async provisionMember(input: ProvisionMemberInput) {
      provisioned.push(input);
      const emailKey = input.email?.trim().toLowerCase();
      if (emailKey && emailToSub.has(emailKey)) {
        return { keycloakSub: emailToSub.get(emailKey)!, reused: true };
      }
      if (usernameToSub.has(input.username)) {
        return {
          keycloakSub: usernameToSub.get(input.username)!,
          reused: true,
        };
      }
      sequence += 1;
      const keycloakSub = `kc-sub-${sequence}`;
      if (emailKey) emailToSub.set(emailKey, keycloakSub);
      usernameToSub.set(input.username, keycloakSub);
      return { keycloakSub, reused: false };
    },
    async setProvisionalPassword() {
      return undefined;
    },
  } as Pick<
    KeycloakProvisioningService,
    'provisionMember' | 'setProvisionalPassword'
  > as KeycloakProvisioningService;

  return { service, provisioned, emailToSub, usernameToSub };
}

function seedOrgAndClinic(
  organizations: InMemoryOrganizationRepository,
  clinics: InMemoryClinicRepository,
) {
  organizations.items.push(
    Organization.create(
      {
        storeId: STORE_ID,
        name: 'Clínica Teste',
        status: 'active',
        plan: {
          planId: 'plan-1',
          tier: 'basic',
          maxClinics: 5,
          maxUsers: 20,
        },
        overQuota: false,
        suspendedReason: null,
        platformUpdatedAt: null,
        syncedAt: new Date(),
      },
      ORGANIZATION_ID,
    ),
  );
  clinics.items.push(
    Clinic.create(
      {
        organizationId: ORGANIZATION_ID,
        name: 'Unidade raiz',
        slug: 'raiz',
        isRoot: true,
        status: 'active',
        legalName: null,
        document: null,
        stateRegistration: null,
        zipCode: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        phone: null,
        timezone: 'America/Sao_Paulo',
      },
      CLINIC_ID,
    ),
  );
}

function buildUseCase(keycloakOptions?: Parameters<typeof buildKeycloakStub>[0]) {
  const members = new InMemoryMemberRepository();
  const organizations = new InMemoryOrganizationRepository();
  const clinics = new InMemoryClinicRepository();
  seedOrgAndClinic(organizations, clinics);
  const keycloak = buildKeycloakStub(keycloakOptions);
  const useCase = new CreateMemberUseCase(
    members,
    organizations,
    clinics,
    keycloak.service,
  );
  return { useCase, members, keycloak };
}

const baseInput = {
  storeId: STORE_ID,
  firstName: 'Ana',
  lastName: 'Souza',
  username: 'ana.souza',
  email: 'ana.souza@clinica.com',
  clinics: [{ clinicId: CLINIC_ID, role: 'secretario' }],
};

describe('CreateMemberUseCase', () => {
  it('cria membro novo com senha provisória', async () => {
    const { useCase, members } = buildUseCase();

    const result = await useCase.execute(baseInput);

    expect(result.provisionalPassword).toHaveLength(10);
    expect(result.member.username).toBe('ana.souza');
    expect(result.member.hasPassword).toBe(false);
    expect(members.items).toHaveLength(1);
  });

  it('recusa username já ativo com mensagem clara', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute(baseInput);

    await expect(
      useCase.execute({
        ...baseInput,
        email: 'outro@clinica.com',
      }),
    ).rejects.toBeInstanceOf(MemberUsernameTakenError);
  });

  it('recusa e-mail já ativo com mensagem clara', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute(baseInput);

    await expect(
      useCase.execute({
        ...baseInput,
        username: 'ana.outra',
      }),
    ).rejects.toBeInstanceOf(MemberEmailTakenError);
  });

  it('reativa membro soft-deleted quando o Keycloak reusa o mesmo sub', async () => {
    const { useCase, members, keycloak } = buildUseCase();
    const created = await useCase.execute(baseInput);
    await members.softDelete(created.member.id);

    keycloak.emailToSub.set('ana.souza@clinica.com', created.member.keycloakSub);
    keycloak.usernameToSub.set('ana.souza', created.member.keycloakSub);

    const restored = await useCase.execute(baseInput);

    expect(restored.member.id).toBe(created.member.id);
    expect(restored.member.status).toBe('active');
    expect(members.items.filter((m) => m.deletedAt === null)).toHaveLength(1);
    expect(restored.provisionalPassword).toHaveLength(10);
  });

  it('reativa soft-deleted pelo username quando o Keycloak cria um sub novo', async () => {
    const { useCase, members } = buildUseCase();
    const created = await useCase.execute(baseInput);
    await members.softDelete(created.member.id);
    // Libera o keycloak_sub antigo e mantém o username ocupado (soft-delete).
    members.items[0].keycloakSub = 'kc-sub-legado-orphaned';

    const restored = await useCase.execute({
      ...baseInput,
      email: 'ana.nova@clinica.com',
    });

    expect(restored.member.id).toBe(created.member.id);
    expect(restored.member.keycloakSub).not.toBe('kc-sub-legado-orphaned');
    expect(restored.member.email).toBe('ana.nova@clinica.com');
    expect(restored.member.status).toBe('active');
  });

  it('recusa keycloak_sub de outra organização com 409 claro', async () => {
    // Mesmo username no Keycloak → mesmo sub; e-mail local diferente para
    // não cair no MemberEmailTakenError antes do provisionamento.
    const { useCase, members } = buildUseCase({
      usernameToSub: [['ana.souza', 'kc-other-org']],
    });

    members.items.push({
      id: 'member-other',
      organizationId: 'org-outra',
      keycloakSub: 'kc-other-org',
      username: 'ana.souza',
      email: 'ana.outro@org.com',
      firstName: 'Ana',
      lastName: 'Outra',
      status: 'active',
      organizationRole: 'COLLABORATOR',
      hasPassword: true,
      provisionalExpiresAt: null,
      disabledAt: null,
      deletedAt: null,
      councilType: null,
      councilNumber: null,
      councilUf: null,
      memberships: [],
    });

    // Username vivo em outra org: findByUsername é global — simula só a colisão
    // de sub (soft-deleted na outra org libera o username localmente).
    members.items[0].deletedAt = new Date();
    members.items[0].username = 'ana.souza.legado';

    let erro: MemberIdentityTakenError | undefined;
    try {
      await useCase.execute(baseInput);
    } catch (e) {
      erro = e as MemberIdentityTakenError;
    }

    expect(erro).toBeInstanceOf(MemberIdentityTakenError);
    expect(erro!.externalMessage).toContain('outra organização');
  });
});
