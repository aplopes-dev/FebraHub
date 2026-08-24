import type { StoreSettingsEntity } from '../../../../domain/entities/store-settings.entity';
import { mapStoreBillingToHttp } from '../shared/store-settings-response.mapper';

export class GetStoreBillingPresenter {
  static toHttp(settings: StoreSettingsEntity) {
    return { data: mapStoreBillingToHttp(settings) };
  }
}
