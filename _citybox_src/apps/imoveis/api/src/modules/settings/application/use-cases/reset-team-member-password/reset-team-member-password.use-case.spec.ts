import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { resolveImoveisPermissions } from '../../../domain/resolve-imoveis-permissions';
import { FakeIdentityProvider } from '../../../../tenancy/tests/fake-identity.provider';
import { ResetTeamMemberPasswordUseCase } from './reset-team-member-password.use-case';

type MemberSeed = {
  agentId: string;
  email: string;
  role: 'admin' | 'broker';
  keycloakSub: string;
  mustChangePassword?: boolean;
};

async function seedMember(
  members: InMemoryTeamMemberRepository,
  seed: MemberSeed,
) {
  return members.create('store-1', {
    agentId: seed.agentId,
    name: 'Membro Teste',
    email: seed.email,
    phone: '',
    role: seed.role,
    initials: 'MT',
    active: true,
    permissions: resolveImoveisPermissions(seed.role),
    lastAccessAt: null,
    passwordHash: null,
    temporaryPassword: null,
    mustChangePassword: seed.mustChangePassword ?? false,
    keycloakSub: seed.keycloakSub,
    username: seed.email,
    hasPassword: true,
  });
}

describe('ResetTeamMemberPasswordUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let identity: FakeIdentityProvider;
  let useCase: ResetTeamMemberPasswordUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    identity = new FakeIdentityProvider();
    useCase = new ResetTeamMemberPasswordUseCase(members, identity);
  });

  it('recria a identidade quando o sub antigo não existe mais', async () => {
    const member = await seedMember(members, {
      agentId: 'daniel-ll',
      email: 'financeiro@phoenix.com.br',
      role: 'admin',
      keycloakSub: 'aplopes-dead-sub',
      mustChangePassword: true,
    });
    identity.missingSubs.add('aplopes-dead-sub');

    const result = await useCase.execute({
      storeId: 'store-1',
      agentId: 'daniel-ll',
    });

    expect(result.username).toBe('financeiro@phoenix.com.br');
    expect(result.provisionalPassword).toHaveLength(10);

    const updated = await members.findByAgentId('store-1', 'daniel-ll');
    expect(updated?.id).toBe(member.id);
    expect(updated?.keycloakSub).not.toBe('aplopes-dead-sub');
    expect(updated?.mustChangePassword).toBe(false);
    expect(identity.passwords.get(updated!.keycloakSub!)).toBe(
      result.provisionalPassword,
    );
  });

  it('reaproveita o sub existente e grava a nova senha nele', async () => {
    await seedMember(members, {
      agentId: 'broker',
      email: 'broker@loja.com',
      role: 'broker',
      keycloakSub: 'sub-broker',
    });

    const result = await useCase.execute({
      storeId: 'store-1',
      agentId: 'broker',
    });

    expect(identity.passwords.get('sub-broker')).toBe(
      result.provisionalPassword,
    );
    const updated = await members.findByAgentId('store-1', 'broker');
    expect(updated?.keycloakSub).toBe('sub-broker');
    // A troca definitiva é UPDATE_PASSWORD no Keycloak; sem modal no Imóveis.
    expect(updated?.mustChangePassword).toBe(false);
  });

  it('no reset do admin não abre o modal interno de nova senha', async () => {
    await seedMember(members, {
      agentId: 'owner',
      email: 'owner@loja.com',
      role: 'admin',
      keycloakSub: 'sub-owner',
    });

    await useCase.execute({
      storeId: 'store-1',
      agentId: 'owner',
      requireKeycloakPasswordUpdate: true,
    });

    expect(identity.passwords.has('sub-owner')).toBe(true);
    const updated = await members.findByAgentId('store-1', 'owner');
    expect(updated?.mustChangePassword).toBe(false);
  });
});
