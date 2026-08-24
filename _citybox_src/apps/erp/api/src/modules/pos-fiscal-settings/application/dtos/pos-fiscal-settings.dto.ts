import type { PosDocumentModel } from '../../domain/entities/pos-fiscal-settings.entity';

export type GetPosFiscalSettingsDto = { organizationId: string };

export type UpsertPosFiscalSettingsDto = {
  organizationId: string;
  posDocumentModel: PosDocumentModel | null;
  updatedByUserId: string | null;
};
