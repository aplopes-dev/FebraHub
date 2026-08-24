import { UploadFinancialEntryAttachmentUseCase } from './upload-financial-entry-attachment.use-case';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { InvalidAttachmentFileError } from '../../../domain/errors/invalid-attachment-file.error';
import {
  FINANCIAL_ENTRY_ID,
  ORGANIZATION_ID,
  makeFinancialEntry,
  makeFinancialEntryRepositories,
} from '../../../tests/financial-entries-test-factory';

const PDF_BUFFER = Buffer.from('%PDF-1.4\n%mock-pdf-content\n');
const OVERSIZED_PDF_BUFFER = Buffer.concat([
  Buffer.from('%PDF-1.4\n'),
  Buffer.alloc(5 * 1024 * 1024 + 1, 0x41),
]);
const NOT_A_FILE_BUFFER = Buffer.from('this is definitely not a real file');

describe('UploadFinancialEntryAttachmentUseCase', () => {
  function setup() {
    const repos = makeFinancialEntryRepositories();
    const upload = new UploadFinancialEntryAttachmentUseCase(
      repos.financialEntryRepository,
      repos.financialEntryAttachmentRepository,
      repos.objectStorage,
    );
    return { ...repos, upload };
  }

  it('stores the file and persists the attachment metadata', async () => {
    const { upload, financialEntryRepository, objectStorage } = setup();
    const entry = makeFinancialEntry();
    await financialEntryRepository.save(entry);

    const attachment = await upload.execute({
      organizationId: ORGANIZATION_ID,
      financialEntryId: entry.id,
      fileName: 'comprovante.pdf',
      buffer: PDF_BUFFER,
      declaredMimeType: 'application/pdf',
    });

    expect(attachment.fileName).toBe('comprovante.pdf');
    expect(attachment.contentType).toBe('application/pdf');
    expect(attachment.sizeBytes).toBe(PDF_BUFFER.length);
    expect(attachment.financialEntryId).toBe(entry.id);
    expect(await objectStorage.exists(attachment.objectKey)).toBe(true);
  });

  it('throws InvalidAttachmentFileError when the file exceeds 5MB', async () => {
    const { upload, financialEntryRepository } = setup();
    const entry = makeFinancialEntry();
    await financialEntryRepository.save(entry);

    await expect(
      upload.execute({
        organizationId: ORGANIZATION_ID,
        financialEntryId: entry.id,
        fileName: 'grande.pdf',
        buffer: OVERSIZED_PDF_BUFFER,
        declaredMimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(InvalidAttachmentFileError);
  });

  it('throws InvalidAttachmentFileError when the binary signature is not PDF/image', async () => {
    const { upload, financialEntryRepository } = setup();
    const entry = makeFinancialEntry();
    await financialEntryRepository.save(entry);

    await expect(
      upload.execute({
        organizationId: ORGANIZATION_ID,
        financialEntryId: entry.id,
        fileName: 'arquivo.pdf',
        buffer: NOT_A_FILE_BUFFER,
        declaredMimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(InvalidAttachmentFileError);
  });

  it('throws FinancialEntryNotFoundError when the entry does not belong to the organization', async () => {
    const { upload } = setup();

    await expect(
      upload.execute({
        organizationId: ORGANIZATION_ID,
        financialEntryId: FINANCIAL_ENTRY_ID,
        fileName: 'comprovante.pdf',
        buffer: PDF_BUFFER,
        declaredMimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });
});
