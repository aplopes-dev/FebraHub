import type { StoreSettingsEntity } from '../../../../domain/entities/store-settings.entity';
import { mapStoreSettingsToHttp } from '../shared/store-settings-response.mapper';

export class GetStoreSettingsPresenter {
  static toHttp(settings: StoreSettingsEntity) {
    return { data: mapStoreSettingsToHttp(settings) };
  }
}
