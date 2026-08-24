import { UpdateMemberUseCase } from './update-member.use-case';
import { OrganizationOwnerProtectedError } from '../../../domain/errors/member.errors';
import type {
  MemberRecord,
  MemberRepository,
} from '../../../domain/repositories/member.repository';

const STORE = '0196f0a0-0000-7000-8000-0000000000dd';
const CALLER_ID = 'caller-1';

function member(overrides?: Partial<MemberRecord>): MemberRecord {
  return {
    id: 'member-1',
    organizationId: 'org-1',
    keycloakSub: 'sub-1',
    username: 'ana',
    email: 'ana@salon.com',
    firstName: 'Ana',
    lastName: 'Silva',
    phone: null,
    status: 'active',
    organizationRole: 'COLLABORATOR',
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    memberships: [
      {
        storeId: STORE,
        storeName: 'Salon',
        role: 'profissional',
        permissions: [],
      },
    ],
    ...overrides,
  };
}

function harness(existing: MemberRecord, caller: MemberRecord) {
  const members = {
    findInStore: jest.fn(async (_storeId: string, memberId: string) => {
      if (memberId === existing.id) return existing;
      if (memberId === caller.id) return caller;
      return null;
    }),
    updateProfile: jest.fn().mockResolvedValue(undefined),
    findExistingServiceIds: jest.fn(),
    replaceStoreMembership: jest.fn(),
    replaceServiceIds: jest.fn(),
    replaceWorkIntervals: jest.fn(),
  };

  const useCase = new UpdateMemberUseCase(
    members as unknown as MemberRepository,
  );

  return { members, useCase };
}

describe('UpdateMemberUseCase', () => {
  it('recusa desativar responsável da organização', async () => {
    const target = member({
      id: 'owner-1',
      organizationRole: 'OWNER',
    });
    const { members, useCase } = harness(target, member({ id: CALLER_ID }));

    await expect(
      useCase.execute({
        storeId: STORE,
        memberId: target.id,
        status: 'disabled',
      }),
    ).rejects.toBeInstanceOf(OrganizationOwnerProtectedError);
    expect(members.updateProfile).not.toHaveBeenCalled();
  });

  it('recusa alterar permissões do responsável da organização', async () => {
    const target = member({
      id: 'owner-1',
      organizationRole: 'OWNER',
    });
    const { members, useCase } = harness(target, member({ id: CALLER_ID }));

    await expect(
      useCase.execute({
        storeId: STORE,
        memberId: target.id,
        permissions: ['schedule_view_menu', 'client_create'],
      }),
    ).rejects.toBeInstanceOf(OrganizationOwnerProtectedError);
    expect(members.replaceStoreMembership).not.toHaveBeenCalled();
  });

  it('permite reativar responsável da organização', async () => {
    const target = member({
      id: 'owner-1',
      organizationRole: 'OWNER',
      status: 'disabled',
    });
    const { members, useCase } = harness(target, member({ id: CALLER_ID }));

    await useCase.execute({
      storeId: STORE,
      memberId: target.id,
      status: 'active',
    });

    expect(members.updateProfile).toHaveBeenCalled();
  });

  it('permite editar dados e cargo operacional do responsável sem enviar permissões', async () => {
    const target = member({
      id: 'owner-1',
      organizationRole: 'OWNER',
    });
    const { members, useCase } = harness(target, member({ id: CALLER_ID }));

    await useCase.execute({
      storeId: STORE,
      memberId: target.id,
      firstName: 'Ana Maria',
      role: 'profissional',
    });

    expect(members.updateProfile).toHaveBeenCalled();
    expect(members.replaceStoreMembership).toHaveBeenCalledWith(
      STORE,
      target.id,
      { role: 'profissional' },
    );
  });

  it('permite editar papel e permissões de colaborador', async () => {
    const target = member({ id: 'collab-1' });
    const { members, useCase } = harness(target, member({ id: CALLER_ID }));

    await useCase.execute({
      storeId: STORE,
      memberId: target.id,
      role: 'recepcao',
      permissions: ['schedule_view_menu', 'client_read'],
    });

    expect(members.replaceStoreMembership).toHaveBeenCalledWith(
      STORE,
      target.id,
      {
        role: 'recepcao',
        permissions: ['schedule_view_menu', 'client_read'],
      },
    );
  });

  it('permite editar o próprio papel e permissões', async () => {
    const target = member({ id: CALLER_ID });
    const { members, useCase } = harness(target, target);

    await useCase.execute({
      storeId: STORE,
      memberId: CALLER_ID,
      role: 'gerente',
      permissions: ['schedule_view_menu', 'client_read'],
    });

    expect(members.replaceStoreMembership).toHaveBeenCalledWith(
      STORE,
      CALLER_ID,
      {
        role: 'gerente',
        permissions: ['schedule_view_menu', 'client_read'],
      },
    );
  });
});
