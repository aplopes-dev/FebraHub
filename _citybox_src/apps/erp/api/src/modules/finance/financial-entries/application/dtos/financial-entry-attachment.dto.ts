export type UploadFinancialEntryAttachmentDto = {
  organizationId: string;
  financialEntryId: string;
  fileName: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type GetFinancialEntryAttachmentDto = {
  organizationId: string;
  financialEntryId: string;
  attachmentId: string;
};

export type DeleteFinancialEntryAttachmentDto = {
  organizationId: string;
  financialEntryId: string;
  attachmentId: string;
};
