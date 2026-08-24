import { GetPropertyDocumentUseCase } from './get-property-document.use-case';
import { UploadPropertyDocumentUseCase } from '../upload-property-document/upload-property-document.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { PropertyDocumentNotFoundError } from '../../../domain/errors/property-document-not-found.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';

const STORE = 'store-1';
const PDF_BUFFER = Buffer.from('%PDF-1.7\nconteudo', 'binary');

describe('GetPropertyDocumentUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let storage: InMemoryObjectStorage;
  let useCase: GetPropertyDocumentUseCase;
  let upload: UploadPropertyDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    storage = new InMemoryObjectStorage();
    useCase = new GetPropertyDocumentUseCase(repo, storage);
    upload = new UploadPropertyDocumentUseCase(repo, storage);
  });

  async function createPropertyWithDocument() {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const updated = await upload.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PDF_BUFFER,
      filename: 'Escritura.pdf',
    });
    return { propertyId: property.id, document: updated.documents[0] };
  }

  it('retorna bytes e mime do documento', async () => {
    const { propertyId, document } = await createPropertyWithDocument();

    const result = await useCase.execute({
      storeId: STORE,
      propertyId,
      documentId: document.id,
    });

    expect(result.buffer.equals(PDF_BUFFER)).toBe(true);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.name).toBe('Escritura.pdf');
  });

  it('lança PropertyDocumentNotFoundError para documento inexistente', async () => {
    const { propertyId } = await createPropertyWithDocument();

    await expect(
      useCase.execute({ storeId: STORE, propertyId, documentId: 'missing' }),
    ).rejects.toBeInstanceOf(PropertyDocumentNotFoundError);
  });

  it('lança PropertyDocumentNotFoundError para documento legado sem arquivo', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    await repo.addDocument(STORE, property.id, {
      id: 'legacy-1',
      name: 'Antigo.pdf',
      sizeLabel: '1.0 MB',
      objectKey: null as unknown as string,
      mimeType: 'application/pdf',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        documentId: 'legacy-1',
      }),
    ).rejects.toBeInstanceOf(PropertyDocumentNotFoundError);
  });

  it('lança PropertyNotFoundError quando o imóvel não existe', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: 'missing',
        documentId: 'doc',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
