import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InvalidDocumentFileError } from '../../../../properties/domain/errors/invalid-document-file.error';
import { InvalidLegalDocumentKindError } from '../../../domain/errors/invalid-legal-document-kind.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UpsertAgentLegalDocumentUseCase } from './upsert-agent-legal-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PDF_BUFFER = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46]),
  Buffer.alloc(64),
]);

describe('UpsertAgentLegalDocumentUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: UpsertAgentLegalDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new UpsertAgentLegalDocumentUseCase(repo, storage);
  });

  it('salva o documento no MinIO e vincula ao perfil', async () => {
    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
      buffer: PDF_BUFFER,
      filename: 'creci.pdf',
    });

    expect(profile.legalDocuments).toHaveLength(1);
    const document = profile.legalDocuments[0];
    expect(document.kind).toBe('license');
    expect(document.name).toBe('creci.pdf');
    expect(document.mimeType).toBe('application/pdf');
    expect(document.objectKey).toMatch(
      new RegExp(
        `^${STORE}/settings/profiles/${AGENT}/legal/license/.+\\.pdf$`,
      ),
    );
    expect(await storage.exists(document.objectKey)).toBe(true);
  });

  it('substitui o arquivo anterior do mesmo tipo', async () => {
    const first = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
      buffer: PDF_BUFFER,
      filename: 'creci.pdf',
    });
    const previousKey = first.legalDocuments[0].objectKey;

    const second = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
      buffer: PDF_BUFFER,
      filename: 'creci-2026.pdf',
    });

    expect(second.legalDocuments).toHaveLength(1);
    expect(second.legalDocuments[0].name).toBe('creci-2026.pdf');
    expect(await storage.exists(previousKey)).toBe(false);
    expect(await storage.exists(second.legalDocuments[0].objectKey)).toBe(true);
  });

  it('mantém tipos diferentes lado a lado', async () => {
    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
      buffer: PDF_BUFFER,
      filename: 'creci.pdf',
    });
    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'insurance',
      buffer: PDF_BUFFER,
      filename: 'seguro.pdf',
    });

    expect(profile.legalDocuments.map((doc) => doc.kind).sort()).toEqual([
      'insurance',
      'license',
    ]);
  });

  it('rejeita tipo de documento desconhecido', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        kind: 'passport',
        buffer: PDF_BUFFER,
        filename: 'doc.pdf',
      }),
    ).rejects.toBeInstanceOf(InvalidLegalDocumentKindError);
  });

  it('rejeita arquivo cuja extensão não bate com o conteúdo', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        kind: 'license',
        buffer: PDF_BUFFER,
        filename: 'creci.docx',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentFileError);
  });
});
