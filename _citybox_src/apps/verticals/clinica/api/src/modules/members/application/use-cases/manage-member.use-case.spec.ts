import type { KeycloakProvisioningService } from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { Organization } from '../../../tenancy/domain/entities/organization.entity';
import { InMemoryOrganizationRepository } from '../../../tenancy/tests/in-memory-tenancy.repositories';
import { OrganizationOwnerProtectedError } from '../../domain/errors/member.errors';
import { InMemoryMemberRepository } from '../../tests/in-memory-member.repository';
import { MemberEmailTakenError } from '../../domain/errors/member.errors';
import { ManageMemberUseCase } from './manage-member.use-case';

const STORE_ID = 'a1b2c3d4-1111-4111-8111-111111111111';
const ORGANIZATION_ID = 'org-1';
const CLINIC_ID = 'clinic-root';

function buildKeycloakStub() {
  const disabled: Array<{ sub: string; enabled: boolean }> = [];

  const service = {
    async setUserEnabled(sub: string, enabled: boolean) {
      disabled.push({ sub, enabled });
    },
    async setProvisionalPassword() {
      // sem efeito colateral relevante para estes testes
    },
    async updateProfile() {
      // sem efeito colateral relevante para estes testes
    },
  } as Pick<
    KeycloakProvisioningService,
    'setUserEnabled' | 'setProvisionalPassword' | 'updateProfile'
  > as KeycloakProvisioningService;

  return { service, disabled };
}

async function buildUseCase() {
  const members = new InMemoryMemberRepository();
  const organizations = new InMemoryOrganizationRepository();
  const keycloak = buildKeycloakStub();

  await organizations.save(
    Organization.create(
      {
        storeId: STORE_ID,
        name: 'Clínica Demo',
        status: 'active',
        plan: { planId: null, tier: null, maxClinics: null, maxUsers: null },
        overQuota: false,
        suspendedReason: null,
        platformUpdatedAt: null,
        syncedAt: new Date(),
      },
      ORGANIZATION_ID,
    ),
  );

  const owner = await members.create({
    organizationId: ORGANIZATION_ID,
    keycloakSub: 'kc-owner',
    username: 'maria.silva',
    email: 'maria.silva@clinica.com.br',
    firstName: 'Maria',
    lastName: 'Silva',
    organizationRole: 'OWNER',
    hasPassword: false,
    clinics: [{ clinicId: CLINIC_ID, role: 'gerente', permissions: [] }],
  });

  const collaborator = await members.create({
    organizationId: ORGANIZATION_ID,
    keycloakSub: 'kc-colab',
    username: 'joao.souza',
    email: null,
    firstName: 'João',
    lastName: 'Souza',
    hasPassword: true,
    clinics: [{ clinicId: CLINIC_ID, role: 'dentista', permissions: [] }],
  });

  const useCase = new ManageMemberUseCase(
    members,
    organizations,
    keycloak.service,
  );

  return { useCase, members, keycloak, owner, collaborator };
}

describe('ManageMemberUseCase — proteção do responsável', () => {
  it('recusa remover o responsável pela organização', async () => {
    const { useCase, members, keycloak, owner } = await buildUseCase();

    await expect(useCase.remove(STORE_ID, owner.id)).rejects.toThrow(
      OrganizationOwnerProtectedError,
    );
    // Nada acontece nem localmente nem no Keycloak.
    expect(await members.findById(owner.id)).not.toBeNull();
    expect(keycloak.disabled).toHaveLength(0);
  });

  it('recusa desativar o responsável pela organização', async () => {
    const { useCase, members, keycloak, owner } = await buildUseCase();

    await expect(
      useCase.setStatus(STORE_ID, owner.id, 'disabled'),
    ).rejects.toThrow(OrganizationOwnerProtectedError);
    expect((await members.findById(owner.id))?.status).toBe('active');
    expect(keycloak.disabled).toHaveLength(0);
  });

  it('expõe mensagem acionável de transferência de responsabilidade', async () => {
    const { useCase, owner } = await buildUseCase();

    // `externalMessage` é o que chega na tela; `message` carrega o diagnóstico interno.
    await expect(useCase.remove(STORE_ID, owner.id)).rejects.toMatchObject({
      externalMessage: expect.stringContaining('Transfira a responsabilidade'),
    });
  });

  it('continua permitindo remover e desativar colaboradores', async () => {
    const { useCase, members, collaborator } = await buildUseCase();

    await useCase.setStatus(STORE_ID, collaborator.id, 'disabled');
    expect((await members.findById(collaborator.id))?.status).toBe('disabled');

    await useCase.remove(STORE_ID, collaborator.id);
    expect(await members.findById(collaborator.id)).toBeNull();
  });

  it('permite reativar o responsável — o que é proibido é tirar o acesso dele', async () => {
    const { useCase, members, owner } = await buildUseCase();

    await expect(
      useCase.setStatus(STORE_ID, owner.id, 'active'),
    ).resolves.toBeUndefined();
    expect((await members.findById(owner.id))?.status).toBe('active');
  });
});

describe('ManageMemberUseCase — e-mail duplicado', () => {
  // `Member.email` não é `@unique` no banco. Sem a checagem, o segundo membro ficaria com
  // o mesmo e-mail: o Keycloak recusaria no `updateProfile`, mas essa chamada é feita com
  // `.catch(() => undefined)` — a falha sumiria e o operador veria "salvo".
  it('recusa atribuir a um colaborador o e-mail que já é de outro membro', async () => {
    const { useCase, collaborator, owner } = await buildUseCase();

    await expect(
      useCase.update({
        storeId: STORE_ID,
        memberId: collaborator.id,
        email: owner.email!,
      }),
    ).rejects.toBeInstanceOf(MemberEmailTakenError);
  });

  // A mensagem que chega ao operador é a `externalMessage`; a interna carrega o e-mail e
  // não deve vazar para a tela.
  it('devolve mensagem acionável, sem expor o e-mail do outro membro', async () => {
    const { useCase, collaborator, owner } = await buildUseCase();

    let erro: MemberEmailTakenError | undefined;
    try {
      await useCase.update({
        storeId: STORE_ID,
        memberId: collaborator.id,
        email: owner.email!,
      });
    } catch (e) {
      erro = e as MemberEmailTakenError;
    }

    expect(erro?.externalMessage).toBe('Já existe um membro com esse e-mail.');
    expect(erro?.externalMessage).not.toContain(owner.email!);
  });

  it('normaliza o e-mail antes de comparar — maiúsculas não driblam a regra', async () => {
    const { useCase, collaborator, owner } = await buildUseCase();

    await expect(
      useCase.update({
        storeId: STORE_ID,
        memberId: collaborator.id,
        email: owner.email!.toUpperCase(),
      }),
    ).rejects.toBeInstanceOf(MemberEmailTakenError);
  });

  it('permite o membro manter o próprio e-mail ao editar outros campos', async () => {
    const { useCase, owner } = await buildUseCase();

    const atualizado = await useCase.update({
      storeId: STORE_ID,
      memberId: owner.id,
      firstName: 'Maria Clara',
      email: owner.email!,
    });

    expect(atualizado.firstName).toBe('Maria Clara');
    expect(atualizado.email).toBe(owner.email);
  });

  it('aceita e-mail novo que ninguém usa', async () => {
    const { useCase, collaborator } = await buildUseCase();

    const atualizado = await useCase.update({
      storeId: STORE_ID,
      memberId: collaborator.id,
      email: 'joao.souza@clinica.com.br',
    });

    expect(atualizado.email).toBe('joao.souza@clinica.com.br');
  });
});
