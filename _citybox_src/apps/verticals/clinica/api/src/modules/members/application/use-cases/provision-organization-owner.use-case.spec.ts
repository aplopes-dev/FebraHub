import type {
  KeycloakProvisioningService,
  ProvisionMemberInput,
} from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { OrganizationAlreadyHasOwnerError } from '../../domain/errors/member.errors';
import { InMemoryMemberRepository } from '../../tests/in-memory-member.repository';
import { ProvisionOrganizationOwnerUseCase } from './provision-organization-owner.use-case';

const STORE_ID = 'a1b2c3d4-1111-4111-8111-111111111111';
const ORGANIZATION_ID = 'org-1';
const ROOT_CLINIC_ID = 'clinic-root';

function buildKeycloakStub(options: KeycloakStubOptions = {}) {
  const existing = new Set(options.existingUsernames ?? []);
  const provisioned: ProvisionMemberInput[] = [];
  let sequence = 0;
  /** Simula reuso por e-mail: e-mail → sub já conhecido. */
  const emailToSub = new Map(options.emailToSub ?? []);

  const service = {
    async findUserByUsernameOrEmail(identifier: string) {
      if (existing.has(identifier)) {
        return { id: `kc-existing-${identifier}`, username: identifier };
      }
      const byEmail = emailToSub.get(identifier.toLowerCase());
      if (byEmail) {
        return { id: byEmail, username: identifier };
      }
      return null;
    },
    async provisionMember(input: ProvisionMemberInput) {
      provisioned.push(input);
      const emailKey = input.email?.trim().toLowerCase();
      if (emailKey && emailToSub.has(emailKey)) {
        return { keycloakSub: emailToSub.get(emailKey)!, reused: true };
      }
      sequence += 1;
      const keycloakSub = `kc-sub-${sequence}`;
      if (emailKey) emailToSub.set(emailKey, keycloakSub);
      existing.add(input.username);
      return { keycloakSub, reused: false };
    },
  } as Pick<
    KeycloakProvisioningService,
    'findUserByUsernameOrEmail' | 'provisionMember'
  > as KeycloakProvisioningService;

  return { service, provisioned };
}

type KeycloakStubOptions = {
  /** Usernames que o Keycloak considera já existentes (colisão fora do banco local). */
  existingUsernames?: string[];
  /** E-mails que já têm usuário no Keycloak (reuso por billingEmail). */
  emailToSub?: Array<[string, string]>;
};

function buildUseCase(options: KeycloakStubOptions = {}) {
  const members = new InMemoryMemberRepository();
  const keycloak = buildKeycloakStub(options);
  const useCase = new ProvisionOrganizationOwnerUseCase(
    members,
    keycloak.service,
  );
  return { useCase, members, keycloak };
}

const baseInput = {
  storeId: STORE_ID,
  organizationId: ORGANIZATION_ID,
  rootClinicId: ROOT_CLINIC_ID,
  responsibleName: 'Maria Silva',
  billingEmail: 'maria.silva@clinica.com.br',
};

describe('ProvisionOrganizationOwnerUseCase', () => {
  it('cria o responsável real com papel de organização OWNER e vínculo na clínica raiz', async () => {
    const { useCase, members, keycloak } = buildUseCase();

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe('created');
    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner).not.toBeNull();
    expect(owner?.firstName).toBe('Maria');
    expect(owner?.lastName).toBe('Silva');
    expect(owner?.email).toBe('maria.silva@clinica.com.br');
    expect(owner?.username).toBe('maria.silva');
    expect(owner?.organizationRole).toBe('OWNER');
    // Sem senha: o admin gera sob demanda e exibe uma única vez.
    expect(owner?.hasPassword).toBe(false);
    expect(owner?.memberships).toEqual([
      expect.objectContaining({
        clinicId: ROOT_CLINIC_ID,
        role: 'dentista_admin',
      }),
    ]);
    // Identidade criada no realm `citybox-clinica` — sem role de vertical: estar no
    // realm já é o gate de acesso (ADR C-16).
    expect(keycloak.provisioned).toEqual([
      expect.objectContaining({ username: 'maria.silva' }),
    ]);
    expect(keycloak.provisioned[0]).not.toHaveProperty('verticalRole');
    expect(keycloak.provisioned[0]).not.toHaveProperty('realmRole');
  });

  it('aceita responsável sem e-mail e deriva o username do nome', async () => {
    const { useCase, members } = buildUseCase();

    await useCase.execute({ ...baseInput, billingEmail: null });

    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner?.username).toBe('maria.silva');
    expect(owner?.email).toBeNull();
  });

  it('não inventa sobrenome quando o responsável tem um nome só', async () => {
    const { useCase, members } = buildUseCase();

    await useCase.execute({
      ...baseInput,
      responsibleName: 'Madonna',
      billingEmail: null,
    });

    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner?.firstName).toBe('Madonna');
    expect(owner?.lastName).toBe('');
  });

  it('desempata o username com sufixo numérico quando já existe membro com o mesmo', async () => {
    const { useCase, members } = buildUseCase();
    await members.create({
      organizationId: 'outra-org',
      keycloakSub: 'kc-outro',
      username: 'maria.silva',
      email: null,
      firstName: 'Maria',
      lastName: 'Souza',
      hasPassword: true,
      clinics: [],
    });

    await useCase.execute(baseInput);

    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner?.username).toBe('maria.silva2');
  });

  it('desempata também contra username que só existe no Keycloak', async () => {
    const { useCase, members, keycloak } = buildUseCase({
      existingUsernames: ['maria.silva', 'maria.silva2'],
    });

    await useCase.execute(baseInput);

    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner?.username).toBe('maria.silva3');
    expect(keycloak.provisioned[0]?.username).toBe('maria.silva3');
  });

  it('não falha o provisionamento quando o evento não trouxe responsibleName', async () => {
    const { useCase, members, keycloak } = buildUseCase();

    const result = await useCase.execute({
      ...baseInput,
      responsibleName: null,
    });

    expect(result.status).toBe('skipped_without_responsible');
    expect(await members.findOwnerByOrganization(ORGANIZATION_ID)).toBeNull();
    // Nada é criado no Keycloak: não há pessoa para criar.
    expect(keycloak.provisioned).toHaveLength(0);
  });

  it('é idempotente: reprocessar o evento não cria um segundo responsável', async () => {
    const { useCase, members, keycloak } = buildUseCase();

    const first = await useCase.execute(baseInput);
    const second = await useCase.execute(baseInput);

    expect(first.status).toBe('created');
    expect(second.status).toBe('already_provisioned');
    expect(await members.listByOrganization(ORGANIZATION_ID)).toHaveLength(1);
    expect(keycloak.provisioned).toHaveLength(1);
  });

  it('não avisa "sem responsável" no retry de loja já provisionada', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute(baseInput);

    // O retry manual reconstrói o evento do espelho cadastral, que não guarda `owner`.
    const retry = await useCase.execute({
      ...baseInput,
      responsibleName: null,
      billingEmail: null,
    });

    expect(retry.status).toBe('already_provisioned');
  });

  it('traduz a recusa da invariante de OWNER único em erro de domínio', async () => {
    const { useCase, members } = buildUseCase();
    await members.create({
      organizationId: ORGANIZATION_ID,
      keycloakSub: 'kc-concorrente',
      username: 'outro.responsavel',
      email: null,
      firstName: 'Outro',
      lastName: 'Responsável',
      organizationRole: 'OWNER',
      hasPassword: false,
      clinics: [],
    });

    // Simula a corrida que o índice único parcial barra: só a PRIMEIRA leitura (a
    // checagem de idempotência) não enxerga o OWNER concorrente; a gravação recusa.
    const originalFindOwner = members.findOwnerByOrganization.bind(members);
    let firstRead = true;
    members.findOwnerByOrganization = async (organizationId: string) => {
      if (firstRead) {
        firstRead = false;
        return null;
      }
      return originalFindOwner(organizationId);
    };

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      OrganizationAlreadyHasOwnerError,
    );
  });

  it('cria identidade Keycloak dedicada quando o e-mail já é Member noutra organização', async () => {
    const { useCase, members, keycloak } = buildUseCase({
      emailToSub: [['maria.silva@clinica.com.br', 'kc-sub-outra-org']],
    });
    await members.create({
      organizationId: 'outra-org',
      keycloakSub: 'kc-sub-outra-org',
      username: 'maria.silva.outra',
      email: 'maria.silva@clinica.com.br',
      firstName: 'Maria',
      lastName: 'Silva',
      organizationRole: 'OWNER',
      hasPassword: true,
      clinics: [],
    });

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe('created');
    const owner = await members.findOwnerByOrganization(ORGANIZATION_ID);
    expect(owner?.email).toBe('maria.silva@clinica.com.br');
    expect(owner?.keycloakSub).not.toBe('kc-sub-outra-org');
    expect(keycloak.provisioned[0]?.email).toBe(
      `maria.silva+clinic${STORE_ID.replace(/-/g, '').slice(0, 8)}@clinica.com.br`,
    );
  });
});
