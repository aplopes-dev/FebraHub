import { BrasilApiCepProvider } from './brasil-api-cep.provider';
import { CepProviderUnavailableError } from '../../../domain/errors/cep-provider-unavailable.error';

describe('BrasilApiCepProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should map BrasilAPI response to AddressDTO', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        street: 'Rua Doutor Luiz Coutinho',
        neighborhood: 'Centro',
        city: 'Blumenau',
        state: 'SC',
      }),
    });

    const provider = new BrasilApiCepProvider();
    const result = await provider.getAddressByCep('89010025');

    expect(result).toEqual({
      street: 'Rua Doutor Luiz Coutinho',
      neighborhood: 'Centro',
      city: 'Blumenau',
      state: 'SC',
    });
  });

  it('should return null when BrasilAPI responds 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const provider = new BrasilApiCepProvider();
    const result = await provider.getAddressByCep('00000000');

    expect(result).toBeNull();
  });

  it('should throw CepProviderUnavailableError on server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const provider = new BrasilApiCepProvider();

    await expect(provider.getAddressByCep('89010025')).rejects.toBeInstanceOf(
      CepProviderUnavailableError,
    );
  });
});
