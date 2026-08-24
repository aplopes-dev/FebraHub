import { DeletePropertyDocumentUseCase } from './delete-property-document.use-case';
import { UploadPropertyDocumentUseCase } from '../upload-property-document/upload-property-document.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { PropertyDocumentNotFoundError } from '../../../domain/errors/property-document-not-found.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';

const STORE = 'store-1';
const PDF_BUFFER = Buffer.from('%PDF-1.7\nconteudo', 'binary');

describe('DeletePropertyDocumentUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let storage: InMemoryObjectStorage;
  let useCase: DeletePropertyDocumentUseCase;
  let upload: UploadPropertyDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    storage = new InMemoryObjectStorage();
    useCase = new DeletePropertyDocumentUseCase(repo, storage);
    upload = new UploadPropertyDocumentUseCase(repo, storage);
  });

  it('remove documento do banco e do MinIO', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const uploaded = await upload.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PDF_BUFFER,
      filename: 'Escritura.pdf',
    });
    const document = uploaded.documents[0];

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      documentId: document.id,
    });

    expect(updated.documents).toHaveLength(0);
    expect(await storage.exists(document.objectKey!)).toBe(false);
  });

  it('lança PropertyDocumentNotFoundError para documento inexistente', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        documentId: 'missing',
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
