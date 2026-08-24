import type { PosFiscalSettings } from '../../../../domain/entities/pos-fiscal-settings.entity';

export class PosFiscalSettingsPresenter {
  static toHttpDetail(settings: PosFiscalSettings) {
    return {
      id: settings.id,
      posDocumentModel: settings.posDocumentModel,
      updatedByUserId: settings.updatedByUserId,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(settings: PosFiscalSettings) {
    return { data: PosFiscalSettingsPresenter.toHttpDetail(settings) };
  }
}
