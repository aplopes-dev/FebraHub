import { DeleteFinancialEntryAttachmentUseCase } from './delete-financial-entry-attachment.use-case';
import { FinancialEntryAttachmentNotFoundError } from '../../../domain/errors/financial-entry-attachment-not-found.error';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import {
  FINANCIAL_ENTRY_ID,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeFinancialEntry,
  makeFinancialEntryAttachment,
  makeFinancialEntryRepositories,
} from '../../../tests/financial-entries-test-factory';

describe('DeleteFinancialEntryAttachmentUseCase', () => {
  function setup() {
    const repos = makeFinancialEntryRepositories();
    const del = new DeleteFinancialEntryAttachmentUseCase(
      repos.financialEntryRepository,
      repos.financialEntryAttachmentRepository,
      repos.objectStorage,
    );
    return { ...repos, del };
  }

  it('deletes the object from storage and the attachment row', async () => {
    const {
      del,
      financialEntryRepository,
      financialEntryAttachmentRepository,
      objectStorage,
    } = setup();
    const entry = makeFinancialEntry();
    await financialEntryRepository.save(entry);
    const attachment = makeFinancialEntryAttachment({
      financialEntryId: entry.id,
    });
    await financialEntryAttachmentRepository.save(attachment);
    await objectStorage.put({
      key: attachment.objectKey,
      buffer: Buffer.from('conteúdo'),
      mimeType: attachment.contentType,
    });

    await del.execute({
      organizationId: ORGANIZATION_ID,
      financialEntryId: entry.id,
      attachmentId: attachment.id,
    });

    expect(await objectStorage.exists(attachment.objectKey)).toBe(false);
    expect(
      await financialEntryAttachmentRepository.findById(
        ORGANIZATION_ID,
        entry.id,
        attachment.id,
      ),
    ).toBeNull();
  });

  it('throws FinancialEntryAttachmentNotFoundError when the attachment belongs to another entry/organization', async () => {
    const {
      del,
      financialEntryRepository,
      financialEntryAttachmentRepository,
    } = setup();
    const entry = makeFinancialEntry();
    await financialEntryRepository.save(entry);
    const foreignAttachment = makeFinancialEntryAttachment({
      organizationId: OTHER_ORGANIZATION_ID,
      financialEntryId: entry.id,
    });
    await financialEntryAttachmentRepository.save(foreignAttachment);

    await expect(
      del.execute({
        organizationId: ORGANIZATION_ID,
        financialEntryId: entry.id,
        attachmentId: foreignAttachment.id,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryAttachmentNotFoundError);
  });

  it('throws FinancialEntryNotFoundError when the entry does not exist', async () => {
    const { del } = setup();

    await expect(
      del.execute({
        organizationId: ORGANIZATION_ID,
        financialEntryId: FINANCIAL_ENTRY_ID,
        attachmentId: 'a1111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });
});
