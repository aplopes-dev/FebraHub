import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../core/use-case.interface';
import type { AddressDTO } from '../../../domain/providers/cep.provider.interface';
import { ICepProvider } from '../../../domain/providers/cep.provider.interface';
import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';
import { CepNotFoundError } from '../../../domain/errors/cep-not-found.error';
import { onlyDigits } from '../../../core/utils/brazilian-document.utils';

@Injectable()
export class LookupCepUseCase implements IUseCase<string, AddressDTO> {
  constructor(private readonly cepProvider: ICepProvider) {}

  async execute(cep: string): Promise<AddressDTO> {
    const normalized = onlyDigits(cep);

    if (normalized.length !== 8) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid CEP format: "${cep}"`,
        externalMessage: 'CEP inválido. Preencha o endereço manualmente.',
        context: LookupCepUseCase.name,
      });
    }

    const address = await this.cepProvider.getAddressByCep(normalized);

    if (!address) {
      throw new CepNotFoundError(LookupCepUseCase.name, normalized);
    }

    return address;
  }
}
