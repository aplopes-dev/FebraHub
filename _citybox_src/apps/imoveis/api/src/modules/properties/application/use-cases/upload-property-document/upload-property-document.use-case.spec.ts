import {
  MAX_PROPERTY_DOCUMENTS,
  UploadPropertyDocumentUseCase,
} from './upload-property-document.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InvalidDocumentFileError } from '../../../domain/errors/invalid-document-file.error';
import { PropertyDocumentLimitError } from '../../../domain/errors/property-document-limit.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';

const STORE = 'store-1';
const PDF_BUFFER = Buffer.from('%PDF-1.7\nconteudo', 'binary');

describe('UploadPropertyDocumentUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let storage: InMemoryObjectStorage;
  let useCase: UploadPropertyDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    storage = new InMemoryObjectStorage();
    useCase = new UploadPropertyDocumentUseCase(repo, storage);
  });

  async function createProperty() {
    return repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
  }

  it('armazena documento no MinIO e persiste metadados', async () => {
    const property = await createProperty();

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PDF_BUFFER,
      filename: 'Escritura.pdf',
    });

    expect(updated.documents).toHaveLength(1);
    const document = updated.documents[0];
    expect(document.name).toBe('Escritura.pdf');
    expect(document.mimeType).toBe('application/pdf');
    expect(document.sizeLabel).toBe('0 KB');
    expect(document.objectKey).toBe(
      `${STORE}/properties/${property.id}/documents/${document.id}.pdf`,
    );
    expect(await storage.exists(document.objectKey!)).toBe(true);
  });

  it('sanitiza o nome do arquivo', async () => {
    const property = await createProperty();

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PDF_BUFFER,
      filename: '../../etc/Matrícula.pdf',
    });

    expect(updated.documents[0].name).toBe('Matrícula.pdf');
  });

  it('rejeita conteúdo que não é documento', async () => {
    const property = await createProperty();

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        buffer: Buffer.from('texto puro'),
        filename: 'fake.pdf',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentFileError);
  });

  it('lança PropertyDocumentLimitError ao atingir o limite', async () => {
    const property = await createProperty();

    for (let i = 0; i < MAX_PROPERTY_DOCUMENTS; i++) {
      await useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        buffer: PDF_BUFFER,
        filename: `doc-${i}.pdf`,
      });
    }

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        buffer: PDF_BUFFER,
        filename: 'extra.pdf',
      }),
    ).rejects.toBeInstanceOf(PropertyDocumentLimitError);
  });

  it('lança PropertyNotFoundError quando o imóvel não existe', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: 'missing',
        buffer: PDF_BUFFER,
        filename: 'doc.pdf',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
