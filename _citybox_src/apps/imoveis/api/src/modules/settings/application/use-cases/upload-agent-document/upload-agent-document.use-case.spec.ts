import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InvalidDocumentFileError } from '../../../../properties/domain/errors/invalid-document-file.error';
import { InvalidDocumentFolderError } from '../../../domain/errors/invalid-document-folder.error';
import { InvalidDocumentStatusError } from '../../../domain/errors/invalid-document-status.error';
import { InMemoryAgentFolderDocumentRepository } from '../../../infrastructure/database/in-memory-agent-folder-document.repository';
import { UploadAgentDocumentUseCase } from './upload-agent-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PDF_BUFFER = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46]),
  Buffer.alloc(64),
]);

describe('UploadAgentDocumentUseCase', () => {
  let documents: InMemoryAgentFolderDocumentRepository;
  let storage: InMemoryObjectStorage;
  let useCase: UploadAgentDocumentUseCase;

  beforeEach(() => {
    documents = new InMemoryAgentFolderDocumentRepository();
    storage = new InMemoryObjectStorage();
    useCase = new UploadAgentDocumentUseCase(documents, storage);
  });

  it('salva o arquivo no MinIO e registra o documento na pasta', async () => {
    const document = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      folderId: 'client',
      buffer: PDF_BUFFER,
      filename: 'contrato.pdf',
      detailsLabel: 'Contrato de locação',
    });

    expect(document.folderId).toBe('client');
    expect(document.name).toBe('contrato.pdf');
    expect(document.detailsLabel).toBe('Contrato de locação');
    expect(document.source).toBe('manual');
    expect(document.status).toBe('pending');
    expect(document.mimeType).toBe('application/pdf');
    expect(document.objectKey).toMatch(
      new RegExp(`^${STORE}/settings/profiles/${AGENT}/documents/.+\\.pdf$`),
    );
    expect(await storage.exists(document.objectKey!)).toBe(true);
    expect(await documents.findAll(STORE, AGENT)).toHaveLength(1);
  });

  it('aceita status informado', async () => {
    const document = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      folderId: 'signed',
      buffer: PDF_BUFFER,
      filename: 'assinado.pdf',
      status: 'completed',
    });

    expect(document.status).toBe('completed');
    expect(document.detailsLabel).toBe('');
  });

  it('rejeita pasta desconhecida', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        folderId: 'taxes',
        buffer: PDF_BUFFER,
        filename: 'doc.pdf',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentFolderError);
  });

  it('rejeita status desconhecido', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        folderId: 'client',
        buffer: PDF_BUFFER,
        filename: 'doc.pdf',
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentStatusError);
  });

  it('rejeita arquivo cuja extensão não bate com o conteúdo', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        folderId: 'client',
        buffer: PDF_BUFFER,
        filename: 'contrato.docx',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentFileError);
  });
});
