import type { CommissionConfigEntity } from '../../../../domain/entities/commission-config.entity';
import { mapCommissionConfigToHttp } from '../shared/commission-config-response.mapper';

export class PutCommissionConfigPresenter {
  static toHttp(config: CommissionConfigEntity) {
    return { data: mapCommissionConfigToHttp(config) };
  }
}
