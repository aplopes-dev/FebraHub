import type { ServiceHoursConfig } from '../../domain/service-hours.types';

export class ServiceHoursPresenter {
  static toHttp(config: ServiceHoursConfig) {
    return { data: config };
  }
}
