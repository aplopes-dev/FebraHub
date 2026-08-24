import type { FinancialEntryAttachment } from '../../../../domain/entities/financial-entry-attachment.entity';

export class FinancialEntryAttachmentPresenter {
  /** `objectKey` nunca sai daqui — é a chave interna do MinIO. */
  static toHttp(attachment: FinancialEntryAttachment) {
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
    };
  }

  static toHttpSingle(attachment: FinancialEntryAttachment) {
    return { data: this.toHttp(attachment) };
  }
}
