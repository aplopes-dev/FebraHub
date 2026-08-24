import type { PropertyEntity } from '../../../../domain/entities/property.entity';
import { mapPropertyToHttp } from '../shared/property-response.mapper';

export class DeletePropertyPhotoPresenter {
  static toHttp(property: PropertyEntity) {
    return { data: mapPropertyToHttp(property) };
  }
}
