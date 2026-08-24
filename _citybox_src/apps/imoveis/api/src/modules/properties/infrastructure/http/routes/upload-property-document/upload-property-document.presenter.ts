import type { PropertyEntity } from '../../../../domain/entities/property.entity';
import { mapPropertyToHttp } from '../shared/property-response.mapper';

export class UploadPropertyDocumentPresenter {
  static toHttp(property: PropertyEntity) {
    return { data: mapPropertyToHttp(property) };
  }
}
