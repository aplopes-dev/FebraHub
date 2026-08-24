import { InvalidTeamMemberRoleError } from '../../../domain/errors/invalid-team-member-role.error';
import { TeamMemberAlreadyExistsError } from '../../../domain/errors/team-member-already-exists.error';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { FakeIdentityProvider } from '../../../../tenancy/tests/fake-identity.provider';
import { CreateTeamMemberUseCase } from './create-team-member.use-case';

const STORE = 'store-1';

describe('CreateTeamMemberUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let identity: FakeIdentityProvider;
  let useCase: CreateTeamMemberUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    identity = new FakeIdentityProvider();
    useCase = new CreateTeamMemberUseCase(members, identity);
  });

  it('cria o usuário com slug, iniciais e senha provisória na identidade', async () => {
    const { member, provisionalPassword } = await useCase.execute({
      storeId: STORE,
      name: '  Ana Helena Ribeiro ',
      email: 'ana.ribeiro@imoveis.com.br',
      phone: '(41) 99820-4417',
      role: 'admin',
    });

    expect(member.agentId).toBe('ana-helena');
    expect(member.name).toBe('Ana Helena Ribeiro');
    expect(member.initials).toBe('AR');
    expect(member.active).toBe(true);
    expect(member.mustChangePassword).toBe(false);
    expect(member.keycloakSub).toBeTruthy();
    expect(provisionalPassword).toHaveLength(10);
    expect(member.hasPassword).toBe(true);
    expect(identity.passwords.get(member.keycloakSub!)).toBe(
      provisionalPassword,
    );
  });

  it('desfaz a identidade recém-criada quando a senha falha', async () => {
    identity.failOnSetPassword = true;

    await expect(
      useCase.execute({
        storeId: STORE,
        name: 'Ana Helena Ribeiro',
        email: 'ana.ribeiro@imoveis.com.br',
        role: 'admin',
      }),
    ).rejects.toThrow();

    expect(identity.deleted).toHaveLength(1);
    expect(await members.findAll(STORE)).toHaveLength(0);
  });

  it('aplica as permissões do papel por padrão', async () => {
    const { member } = await useCase.execute({
      storeId: STORE,
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      role: 'broker',
    });

    expect(member.permissions.leads).toBe(true);
    expect(member.permissions.users).toBe(false);
  });

  it('aceita permissões customizadas sobre o papel', async () => {
    const { member } = await useCase.execute({
      storeId: STORE,
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      role: 'broker',
      permissions: { users: true },
    });

    expect(member.permissions.users).toBe(true);
    expect(member.permissions.leads).toBe(true);
  });

  it('gera slug único quando o nome se repete', async () => {
    await useCase.execute({
      storeId: STORE,
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      role: 'broker',
    });

    const { member: second } = await useCase.execute({
      storeId: STORE,
      name: 'Bruno Costa',
      email: 'bruno.costa2@imob.com',
      role: 'broker',
    });

    expect(second.agentId).toBe('bruno-costa-2');
  });

  it('rejeita e-mail já cadastrado na loja', async () => {
    await useCase.execute({
      storeId: STORE,
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      role: 'broker',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        name: 'Bruno C.',
        email: 'BRUNO@imob.com',
        role: 'broker',
      }),
    ).rejects.toBeInstanceOf(TeamMemberAlreadyExistsError);
  });

  it('rejeita papel desconhecido', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        name: 'Bruno Costa',
        email: 'bruno@imob.com',
        role: 'manager',
      }),
    ).rejects.toBeInstanceOf(InvalidTeamMemberRoleError);
  });
});
