import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { InvalidCurrentPasswordError } from '../../../domain/errors/invalid-current-password.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { WeakPasswordError } from '../../../domain/errors/weak-password.error';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { hashPassword, verifyPassword } from '../../policies/password-hash';
import { ChangeAgentPasswordUseCase } from './change-agent-password.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('ChangeAgentPasswordUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: ChangeAgentPasswordUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new ChangeAgentPasswordUseCase(members);
  });

  async function createMember(credentials: {
    passwordHash: string | null;
    temporaryPassword: string | null;
  }) {
    return members.create(STORE, {
      agentId: AGENT,
      name: 'Ana Helena',
      email: 'ana@imob.com',
      phone: '',
      role: 'admin',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('admin'),
      lastAccessAt: null,
      mustChangePassword: credentials.temporaryPassword !== null,
      ...credentials,
    });
  }

  it('troca a senha validando o hash atual', async () => {
    await createMember({
      passwordHash: hashPassword('senha-antiga'),
      temporaryPassword: null,
    });

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      currentPassword: 'senha-antiga',
      newPassword: 'senha-nova-123',
    });

    const member = await members.findByAgentId(STORE, AGENT);
    expect(verifyPassword('senha-nova-123', member!.passwordHash!)).toBe(true);
    expect(member?.mustChangePassword).toBe(false);
  });

  it('aceita a senha provisória como senha atual e a descarta', async () => {
    await createMember({ passwordHash: null, temporaryPassword: 'temp1234' });

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      currentPassword: 'temp1234',
      newPassword: 'senha-nova-123',
    });

    const member = await members.findByAgentId(STORE, AGENT);
    expect(member?.temporaryPassword).toBeNull();
    expect(member?.mustChangePassword).toBe(false);
  });

  it('rejeita senha atual incorreta', async () => {
    await createMember({
      passwordHash: hashPassword('senha-antiga'),
      temporaryPassword: null,
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        currentPassword: 'errada',
        newPassword: 'senha-nova-123',
      }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
  });

  it('rejeita nova senha curta demais', async () => {
    await createMember({
      passwordHash: hashPassword('senha-antiga'),
      temporaryPassword: null,
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        currentPassword: 'senha-antiga',
        newPassword: '123',
      }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'fantasma',
        currentPassword: 'x',
        newPassword: 'senha-nova-123',
      }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });

  it('rejeita quando o usuário não tem credencial cadastrada', async () => {
    await createMember({ passwordHash: null, temporaryPassword: null });

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        currentPassword: '',
        newPassword: 'senha-nova-123',
      }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
  });
});
