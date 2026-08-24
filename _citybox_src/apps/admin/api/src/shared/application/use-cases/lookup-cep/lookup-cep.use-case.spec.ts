import type { AddressDTO } from '../../../domain/providers/cep.provider.interface';
import { ICepProvider } from '../../../domain/providers/cep.provider.interface';
import { LookupCepUseCase } from './lookup-cep.use-case';
import { CepNotFoundError } from '../../../domain/errors/cep-not-found.error';
import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';

class FakeCepProvider extends ICepProvider {
  constructor(private readonly result: AddressDTO | null) {
    super();
  }

  async getAddressByCep(): Promise<AddressDTO | null> {
    return this.result;
  }
}

describe('LookupCepUseCase', () => {
  it('should return address for valid CEP', async () => {
    const address: AddressDTO = {
      street: 'Rua Teste',
      neighborhood: 'Centro',
      city: 'Blumenau',
      state: 'SC',
    };
    const useCase = new LookupCepUseCase(new FakeCepProvider(address));

    const result = await useCase.execute('89010-025');

    expect(result).toEqual(address);
  });

  it('should throw ValidatorDomainError for invalid CEP format', async () => {
    const useCase = new LookupCepUseCase(new FakeCepProvider(null));

    await expect(useCase.execute('123')).rejects.toBeInstanceOf(
      ValidatorDomainError,
    );
  });

  it('should throw CepNotFoundError when provider returns null', async () => {
    const useCase = new LookupCepUseCase(new FakeCepProvider(null));

    await expect(useCase.execute('89010000')).rejects.toBeInstanceOf(
      CepNotFoundError,
    );
  });
});
