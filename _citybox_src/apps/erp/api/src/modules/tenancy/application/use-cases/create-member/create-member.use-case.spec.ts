import { CreateMemberUseCase } from './create-member.use-case';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import { MemberEmailTakenError } from '../../../domain/errors/member-email-taken.error';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import {
  makePermissionProfile,
  PERMISSION_PROFILE_ID,
  SYSTEM_PERMISSION_PROFILE_ID,
  makeSystemPermissionProfile,
} from '../../../tests/permission-profile-test-factory';
import { InMemoryPermissionProfileRepository } from '../../../tests/in-memory-permission-profile.repository';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  makeRepositories,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('CreateMemberUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.branchRepository.save(makeBranch());
    const permissionProfileRepository =
      new InMemoryPermissionProfileRepository();
    const profile = await permissionProfileRepository.save(
      makePermissionProfile(),
    );
    repos.membershipRepository.registerPermissionProfile({
      id: profile.id,
      name: profile.name,
      systemKey: profile.systemKey,
      permissionIds: [...profile.permissionIds],
    });
    const useCase = new CreateMemberUseCase(
      repos.identityProvider,
      repos.userRepository,
      repos.membershipRepository,
      repos.branchRepository,
      permissionProfileRepository,
    );
    return { ...repos, permissionProfileRepository, useCase, profile };
  }

  function baseInput(permissionProfileId = PERMISSION_PROFILE_ID) {
    return {
      organizationId: ORGANIZATION_ID,
      email: 'Ana@LojaIlheus.com.br',
      firstName: 'Ana',
      lastName: 'Lima',
      permissionProfileId,
      role: 'MEMBER' as const,
      branchIds: [BRANCH_ID],
    };
  }

  it('cria identidade, vínculo e acesso às filiais', async () => {
    const { useCase, identityProvider } = await setup();

    const result = await useCase.execute(baseInput());

    expect(result.linkedExistingAccount).toBe(false);
    expect(result.provisionalPassword).toHaveLength(12);
    expect(result.detail.membership.role).toBe('MEMBER');
    expect(result.detail.membership.isSeller).toBe(true);
    expect(result.detail.membership.permissionProfileId).toBe(
      PERMISSION_PROFILE_ID,
    );
    expect(result.detail.user.email).toBe('ana@lojailheus.com.br');
    expect(result.detail.user.name).toBe('Ana Lima');
    expect(result.detail.branchIds).toEqual([BRANCH_ID]);
    expect(result.detail.permissionProfile?.id).toBe(PERMISSION_PROFILE_ID);

    const sub = result.detail.user.keycloakSub;
    expect(identityProvider.passwords.get(sub)).toBe(
      result.provisionalPassword,
    );
  });

  it('respeita isSeller=false no create', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      ...baseInput(),
      isSeller: false,
    });

    expect(result.detail.membership.isSeller).toBe(false);
  });

  it('grava nome único sem duplicar sobrenome vazio', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      ...baseInput(),
      email: 'bruno@lojailheus.com.br',
      firstName: 'Bruno',
      lastName: '',
    });

    expect(result.detail.user.name).toBe('Bruno');
  });

  it('força ADMIN quando o perfil é administrador', async () => {
    const { useCase, permissionProfileRepository, membershipRepository } =
      await setup();
    const admin = await permissionProfileRepository.save(
      makeSystemPermissionProfile(),
    );
    membershipRepository.registerPermissionProfile({
      id: admin.id,
      name: admin.name,
      systemKey: admin.systemKey,
      permissionIds: [...admin.permissionIds],
    });

    const result = await useCase.execute({
      ...baseInput(SYSTEM_PERMISSION_PROFILE_ID),
      role: 'OWNER',
      branchIds: [],
    });

    expect(result.detail.membership.role).toBe('ADMIN');
  });

  it('rejeita perfil inexistente ou excluído', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput('99999999-9999-4999-8999-999999999999'),
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotFoundError);
  });

  it('rejeita quem já é membro da organização', async () => {
    const { useCase, seedMember } = await setup();
    await seedMember({ user: { email: 'ana@lojailheus.com.br' } });

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      MemberEmailTakenError,
    );
  });

  it('rejeita filial de outra organização', async () => {
    const { useCase, branchRepository } = await setup();
    await branchRepository.save(
      makeBranch({
        id: OTHER_BRANCH_ID,
        organizationId: OTHER_ORGANIZATION_ID,
        code: '002',
        document: makeCnpj(2),
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [OTHER_BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('desfaz a identidade recém-criada quando a senha provisória falha', async () => {
    const { useCase, identityProvider, membershipRepository } = await setup();
    identityProvider.failOnSetPassword = true;

    await expect(useCase.execute(baseInput())).rejects.toThrow(
      'Keycloak indisponível ao definir a senha provisória',
    );

    expect(identityProvider.deleted).toHaveLength(1);
    expect(identityProvider.users.size).toBe(0);
    expect(membershipRepository.memberships.size).toBe(0);
  });

  it('não deixa usuário local órfão quando a gravação do vínculo falha', async () => {
    const { useCase, identityProvider, userRepository, membershipRepository } =
      await setup();
    jest
      .spyOn(membershipRepository, 'save')
      .mockRejectedValueOnce(new Error('falha ao gravar o vínculo'));

    await expect(useCase.execute(baseInput())).rejects.toThrow(
      'falha ao gravar o vínculo',
    );

    expect(userRepository.users.size).toBe(0);
    expect(identityProvider.deleted).toHaveLength(1);
  });

  it('preserva a identidade que já existia quando a senha provisória falha', async () => {
    const { useCase, identityProvider } = await setup();
    identityProvider.seedUser('ana@lojailheus.com.br');
    identityProvider.failOnSetPassword = true;

    await expect(useCase.execute(baseInput())).rejects.toThrow();

    expect(identityProvider.deleted).toEqual([]);
    expect(identityProvider.users.size).toBe(1);
  });
});
