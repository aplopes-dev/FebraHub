import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { PutAgentProfileUseCase } from './put-agent-profile.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('PutAgentProfileUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let useCase: PutAgentProfileUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    useCase = new PutAgentProfileUseCase(repo);
  });

  it('cria o perfil com os dados textuais normalizados', async () => {
    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      name: '  Ana Helena  ',
      role: 'Corretora',
      email: ' ana@imob.com ',
      phone: '73999990000',
      region: 'Ilhéus',
      stateId: 'CRECI-12345',
      taxId: '000.000.000-00',
    });

    expect(profile.name).toBe('Ana Helena');
    expect(profile.email).toBe('ana@imob.com');
    expect(profile.role).toBe('Corretora');
  });

  it('preserva campos omitidos no update parcial', async () => {
    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      name: 'Ana Helena',
      role: 'Corretora',
      email: 'ana@imob.com',
      taxId: '000.000.000-00',
    });

    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      name: 'Ana',
    });

    expect(profile.name).toBe('Ana');
    expect(profile.role).toBe('Corretora');
    expect(profile.email).toBe('ana@imob.com');
    expect(profile.taxId).toBe('000.000.000-00');
  });

  it('preserva foto e documentos ao regravar os dados textuais', async () => {
    await repo.ensure(STORE, AGENT);
    await repo.setPhoto(STORE, AGENT, {
      objectKey: `${STORE}/settings/profiles/${AGENT}/photo.png`,
      mimeType: 'image/png',
    });
    await repo.upsertLegalDocument(STORE, AGENT, {
      kind: 'license',
      name: 'creci.pdf',
      sizeLabel: '10 KB',
      objectKey: 'key',
      mimeType: 'application/pdf',
    });

    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      name: 'Ana Helena',
    });

    expect(profile.photo?.mimeType).toBe('image/png');
    expect(profile.legalDocuments).toHaveLength(1);
  });
});
