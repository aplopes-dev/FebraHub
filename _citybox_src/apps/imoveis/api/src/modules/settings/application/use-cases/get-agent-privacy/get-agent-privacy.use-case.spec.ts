import { InMemoryAgentDeviceSessionRepository } from '../../../infrastructure/database/in-memory-agent-device-session.repository';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { GetAgentPrivacyUseCase } from './get-agent-privacy.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('GetAgentPrivacyUseCase', () => {
  let profiles: InMemoryAgentProfileRepository;
  let sessions: InMemoryAgentDeviceSessionRepository;
  let useCase: GetAgentPrivacyUseCase;

  beforeEach(() => {
    profiles = new InMemoryAgentProfileRepository();
    sessions = new InMemoryAgentDeviceSessionRepository();
    useCase = new GetAgentPrivacyUseCase(profiles, sessions);
  });

  it('cria a sessão atual padrão quando não há nenhuma', async () => {
    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result.twoFactorEnabled).toBe(false);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].isCurrent).toBe(true);
    expect(await sessions.findAll(STORE, AGENT)).toHaveLength(1);
  });

  it('não duplica a sessão em leituras seguidas', async () => {
    await useCase.execute({ storeId: STORE, agentId: AGENT });
    const second = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(second.sessions).toHaveLength(1);
    expect(await sessions.findAll(STORE, AGENT)).toHaveLength(1);
  });

  it('devolve o 2FA salvo no perfil', async () => {
    await profiles.ensure(STORE, AGENT);
    await profiles.setTwoFactor(STORE, AGENT, true);

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result.twoFactorEnabled).toBe(true);
  });

  it('lista as sessões existentes do corretor', async () => {
    await sessions.create(STORE, AGENT, {
      device: 'MacBook Pro',
      location: 'Ilhéus, BA',
      lastActiveLabel: 'Agora',
      isCurrent: true,
    });
    await sessions.create(STORE, AGENT, {
      device: 'iPhone 15',
      location: 'Itabuna, BA',
      lastActiveLabel: 'Há 2 dias',
      isCurrent: false,
    });

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result.sessions).toHaveLength(2);
  });
});
