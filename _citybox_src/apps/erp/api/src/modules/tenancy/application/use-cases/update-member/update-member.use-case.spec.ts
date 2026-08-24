import { UpdateMemberUseCase } from './update-member.use-case';
import { LastOwnerForbiddenError } from '../../../domain/errors/last-owner-forbidden.error';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import {
  makePermissionProfile,
  PERMISSION_PROFILE_ID,
} from '../../../tests/permission-profile-test-factory';
import { InMemoryPermissionProfileRepository } from '../../../tests/in-memory-permission-profile.repository';
import {
  BRANCH_ID,
  makeBranch,
  makeRepositories,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
  OWNER_MEMBERSHIP_ID,
} from '../../../tests/tenancy-test-factory';

describe('UpdateMemberUseCase', () => {
  async function setup(
    options: { role?: 'ADMIN' | 'MEMBER'; branchIds?: string[] } = {},
  ) {
    const repos = makeRepositories();
    await repos.branchRepository.save(makeBranch());
    await repos.seedOwner();
    await repos.seedMember({
      membership: { role: options.role ?? 'ADMIN' },
      branchIds: options.branchIds,
    });
    const permissionProfileRepository =
      new InMemoryPermissionProfileRepository();
    await permissionProfileRepository.save(makePermissionProfile());
    repos.membershipRepository.registerPermissionProfile({
      id: PERMISSION_PROFILE_ID,
      name: 'Operador customizado',
      systemKey: null,
      permissionIds: ['pdv.operacao.venda.create'],
    });
    const useCase = new UpdateMemberUseCase(
      repos.membershipRepository,
      repos.branchRepository,
      permissionProfileRepository,
    );
    return { ...repos, permissionProfileRepository, useCase };
  }

  it('troca o papel e as filiais do membro', async () => {
    const { useCase } = await setup();

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      role: 'MEMBER',
      branchIds: [BRANCH_ID],
    });

    expect(detail.membership.role).toBe('MEMBER');
    expect(detail.branchIds).toEqual([BRANCH_ID]);
  });

  it('atualiza isSeller', async () => {
    const { useCase } = await setup();

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      isSeller: false,
    });

    expect(detail.membership.isSeller).toBe(false);
  });

  it('atualiza o perfil de acesso', async () => {
    const { useCase } = await setup();

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      permissionProfileId: PERMISSION_PROFILE_ID,
    });

    expect(detail.membership.permissionProfileId).toBe(PERMISSION_PROFILE_ID);
    expect(detail.permissionProfile?.id).toBe(PERMISSION_PROFILE_ID);
  });

  it('rejeita perfil inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: MEMBERSHIP_ID,
        permissionProfileId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotFoundError);
  });

  it('limpa o acesso explícito às filiais ao promover a ADMIN', async () => {
    const { useCase } = await setup({
      role: 'MEMBER',
      branchIds: [BRANCH_ID],
    });

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      role: 'ADMIN',
      branchIds: [BRANCH_ID],
    });

    expect(detail.membership.role).toBe('ADMIN');
    expect(detail.branchIds).toEqual([]);
  });

  it('limpa o acesso explícito ao promover mesmo sem branchIds no corpo', async () => {
    const { useCase, membershipRepository } = await setup({
      role: 'MEMBER',
      branchIds: [BRANCH_ID],
    });

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      role: 'ADMIN',
    });

    expect(detail.branchIds).toEqual([]);

    const rebaixado = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      role: 'MEMBER',
    });
    expect(rebaixado.branchIds).toEqual([]);

    const persistido = await membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(persistido?.branchIds).toEqual([]);
  });

  it('rejeita rebaixar o último responsável ativo', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
        role: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(LastOwnerForbiddenError);
  });

  it('rejeita desativar o último responsável ativo', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
        active: false,
      }),
    ).rejects.toBeInstanceOf(LastOwnerForbiddenError);
  });

  it('permite rebaixar um responsável quando existe outro ativo', async () => {
    const { useCase, seedMember } = await setup();
    await seedMember({
      user: {
        id: 'user-2',
        keycloakSub: 'keycloak-seed-user-2',
        email: 'carlos@lojailheus.com.br',
        name: 'Carlos Dias',
      },
      membership: { id: 'membership-2', role: 'OWNER' },
    });

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: OWNER_MEMBERSHIP_ID,
      role: 'ADMIN',
    });

    expect(detail.membership.role).toBe('ADMIN');
  });
});
