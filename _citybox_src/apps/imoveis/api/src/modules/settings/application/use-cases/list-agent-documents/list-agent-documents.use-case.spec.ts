import type {
  AgentFolderDocumentEntity,
  DocumentSource,
} from '../../../domain/entities/agent-folder-document.entity';
import { InvalidDocumentFolderError } from '../../../domain/errors/invalid-document-folder.error';
import { InMemoryAgentFolderDocumentRepository } from '../../../infrastructure/database/in-memory-agent-folder-document.repository';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import type {
  PortfolioLeadDocumentRow,
  PortfolioPropertyDocumentRow,
} from '../../policies/portfolio-document-mirrors';
import { ListAgentDocumentsUseCase } from './list-agent-documents.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

class FakePortfolioReader {
  leadRows: PortfolioLeadDocumentRow[] = [];
  propertyRows: PortfolioPropertyDocumentRow[] = [];

  async listLeadDocuments(): Promise<PortfolioLeadDocumentRow[]> {
    return this.leadRows;
  }

  async listPropertyDocuments(): Promise<PortfolioPropertyDocumentRow[]> {
    return this.propertyRows;
  }
}

describe('ListAgentDocumentsUseCase', () => {
  let documents: InMemoryAgentFolderDocumentRepository;
  let profiles: InMemoryAgentProfileRepository;
  let portfolio: FakePortfolioReader;
  let useCase: ListAgentDocumentsUseCase;

  beforeEach(() => {
    documents = new InMemoryAgentFolderDocumentRepository();
    profiles = new InMemoryAgentProfileRepository();
    portfolio = new FakePortfolioReader();
    useCase = new ListAgentDocumentsUseCase(
      documents,
      profiles,
      portfolio as never,
    );
  });

  async function createStored(folderId: 'client' | 'legal' = 'client') {
    return documents.create(STORE, AGENT, {
      folderId,
      name: 'contrato.pdf',
      status: 'pending',
      sizeLabel: '1 MB',
      detailsLabel: '',
      objectKey: 'key',
      mimeType: 'application/pdf',
      source: 'manual',
      legalKind: null,
    });
  }

  async function createLegalDocument() {
    await profiles.ensure(STORE, AGENT);
    await profiles.upsertLegalDocument(STORE, AGENT, {
      kind: 'license',
      name: 'creci.pdf',
      sizeLabel: '2 MB',
      objectKey: 'legal-key',
      mimeType: 'application/pdf',
    });
  }

  it('lista os documentos salvos do corretor', async () => {
    const created = await createStored();

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(created.id);
  });

  it('inclui documento legal do perfil como entrada espelhada', async () => {
    await createLegalDocument();

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('profile-legal' satisfies DocumentSource);
    expect(result[0].legalKind).toBe('license');
    expect(result[0].folderId).toBe('legal');
    expect(result[0].detailsLabel).toBe('Licença de corretor');
  });

  it('não espelha um tipo já materializado na pasta', async () => {
    await createLegalDocument();
    await documents.create(STORE, AGENT, {
      folderId: 'legal',
      name: 'creci-antigo.pdf',
      status: 'completed',
      sizeLabel: '2 MB',
      detailsLabel: 'Licença de corretor',
      objectKey: 'stored-key',
      mimeType: 'application/pdf',
      source: 'profile-legal',
      legalKind: 'license',
    });

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('creci-antigo.pdf');
  });

  it('inclui documentos de leads e imóveis da carteira', async () => {
    portfolio.leadRows = [
      {
        id: 'ld1',
        leadId: 'lead-1',
        leadName: 'Maria Silva',
        name: 'rg.pdf',
        sizeLabel: '1 MB',
        kind: 'other',
        addedAt: new Date('2026-08-01'),
        objectKey: 'lead-key',
        mimeType: 'application/pdf',
      },
    ];
    portfolio.propertyRows = [
      {
        id: 'pd1',
        propertyId: 'prop-1',
        propertyName: 'Casa Pontal',
        name: 'matricula.pdf',
        sizeLabel: '2 MB',
        objectKey: 'key',
        mimeType: 'application/pdf',
        createdAt: new Date('2026-08-02'),
      },
    ];

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result).toHaveLength(2);
    const sources = result.map((d) => d.source).sort();
    expect(sources).toEqual(['linked-lead', 'linked-property']);
  });

  it('filtra pasta client sem mezclar legal', async () => {
    await createStored();
    await createLegalDocument();
    portfolio.leadRows = [
      {
        id: 'ld1',
        leadId: 'lead-1',
        leadName: 'Cliente',
        name: 'doc.pdf',
        sizeLabel: '1 MB',
        kind: 'other',
        addedAt: new Date('2026-08-01'),
        objectKey: null,
        mimeType: null,
      },
    ];

    const clientFolder = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      folderId: 'client',
    });
    const legalFolder = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      folderId: 'legal',
    });

    expect(clientFolder).toHaveLength(2);
    expect(clientFolder.every((d) => d.folderId === 'client')).toBe(true);
    expect(legalFolder).toHaveLength(1);
    expect(legalFolder[0].source).toBe('profile-legal');
  });

  it('rejeita pasta desconhecida', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, folderId: 'taxes' }),
    ).rejects.toBeInstanceOf(InvalidDocumentFolderError);
  });

  it('isola documentos por loja nas pastas manuais', async () => {
    await createStored();

    const result = await useCase.execute({
      storeId: 'store-2',
      agentId: AGENT,
    });

    expect(result).toHaveLength(0);
  });
});
