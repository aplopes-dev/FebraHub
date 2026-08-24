import type { AddressDTO } from '../../../../domain/providers/cep.provider.interface';
import { formatZipCode } from './lookup-cep.mapper';

export class LookupCepPresenter {
  static toHttp(cep: string, address: AddressDTO) {
    return {
      data: {
        zipCode: formatZipCode(cep),
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
    };
  }
}
