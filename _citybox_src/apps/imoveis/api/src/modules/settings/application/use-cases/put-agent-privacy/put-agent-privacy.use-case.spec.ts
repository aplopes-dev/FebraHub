import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { PutAgentPrivacyUseCase } from './put-agent-privacy.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('PutAgentPrivacyUseCase', () => {
  let profiles: InMemoryAgentProfileRepository;
  let useCase: PutAgentPrivacyUseCase;

  beforeEach(() => {
    profiles = new InMemoryAgentProfileRepository();
    useCase = new PutAgentPrivacyUseCase(profiles);
  });

  it('liga o 2FA criando o perfil se necessário', async () => {
    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      twoFactorEnabled: true,
    });

    expect(profile.twoFactorEnabled).toBe(true);
    const saved = await profiles.findByAgentId(STORE, AGENT);
    expect(saved?.twoFactorEnabled).toBe(true);
  });

  it('desliga o 2FA', async () => {
    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      twoFactorEnabled: true,
    });

    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      twoFactorEnabled: false,
    });

    expect(profile.twoFactorEnabled).toBe(false);
  });

  it('mantém os demais campos do perfil', async () => {
    await profiles.upsert(STORE, AGENT, { name: 'Ana Helena' });

    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      twoFactorEnabled: true,
    });

    expect(profile.name).toBe('Ana Helena');
  });
});
