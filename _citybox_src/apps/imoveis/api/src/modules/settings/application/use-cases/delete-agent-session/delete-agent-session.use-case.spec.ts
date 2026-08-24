import { AgentDeviceSessionNotFoundError } from '../../../domain/errors/agent-device-session-not-found.error';
import { CurrentSessionForbiddenError } from '../../../domain/errors/current-session-forbidden.error';
import { InMemoryAgentDeviceSessionRepository } from '../../../infrastructure/database/in-memory-agent-device-session.repository';
import { DeleteAgentSessionUseCase } from './delete-agent-session.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('DeleteAgentSessionUseCase', () => {
  let sessions: InMemoryAgentDeviceSessionRepository;
  let useCase: DeleteAgentSessionUseCase;

  beforeEach(() => {
    sessions = new InMemoryAgentDeviceSessionRepository();
    useCase = new DeleteAgentSessionUseCase(sessions);
  });

  it('encerra uma sessão de outro dispositivo', async () => {
    const session = await sessions.create(STORE, AGENT, {
      device: 'iPhone 15',
      location: 'Itabuna, BA',
      lastActiveLabel: 'Há 2 dias',
      isCurrent: false,
    });

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      sessionId: session.id,
    });

    expect(await sessions.findAll(STORE, AGENT)).toHaveLength(0);
  });

  it('rejeita encerrar a sessão atual', async () => {
    const session = await sessions.create(STORE, AGENT, {
      device: 'MacBook Pro',
      location: 'Ilhéus, BA',
      lastActiveLabel: 'Agora',
      isCurrent: true,
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        sessionId: session.id,
      }),
    ).rejects.toBeInstanceOf(CurrentSessionForbiddenError);
    expect(await sessions.findAll(STORE, AGENT)).toHaveLength(1);
  });

  it('rejeita sessão inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        sessionId: 'missing',
      }),
    ).rejects.toBeInstanceOf(AgentDeviceSessionNotFoundError);
  });

  it('não encerra sessão de outra loja', async () => {
    const session = await sessions.create(STORE, AGENT, {
      device: 'iPhone 15',
      location: 'Itabuna, BA',
      lastActiveLabel: 'Há 2 dias',
      isCurrent: false,
    });

    await expect(
      useCase.execute({
        storeId: 'store-2',
        agentId: AGENT,
        sessionId: session.id,
      }),
    ).rejects.toBeInstanceOf(AgentDeviceSessionNotFoundError);
  });
});
