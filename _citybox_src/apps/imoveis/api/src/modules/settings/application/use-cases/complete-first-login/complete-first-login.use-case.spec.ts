import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { WeakPasswordError } from '../../../domain/errors/weak-password.error';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { verifyPassword } from '../../policies/password-hash';
import { CompleteFirstLoginUseCase } from './complete-first-login.use-case';

const STORE = 'store-1';
const AGENT = 'diego-alves';

describe('CompleteFirstLoginUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: CompleteFirstLoginUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new CompleteFirstLoginUseCase(members);
  });

  async function createMember() {
    return members.create(STORE, {
      agentId: AGENT,
      name: 'Diego Alves',
      email: 'diego@imob.com',
      phone: '',
      role: 'broker',
      initials: 'DA',
      active: true,
      permissions: permissionsForRole('broker'),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: 'Imv-a7Kx9Q2m',
      mustChangePassword: true,
    });
  }

  it('define a senha definitiva e limpa a provisória', async () => {
    await createMember();

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      newPassword: 'senha-nova-123',
    });

    expect(updated.mustChangePassword).toBe(false);
    expect(updated.temporaryPassword).toBeNull();
    expect(verifyPassword('senha-nova-123', updated.passwordHash!)).toBe(true);
  });

  it('rejeita senha curta demais', async () => {
    await createMember();

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        newPassword: '123',
      }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'fantasma',
        newPassword: 'senha-nova-123',
      }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });
});
