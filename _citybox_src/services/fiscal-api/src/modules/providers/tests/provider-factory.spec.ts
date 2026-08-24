import { FiscalProviderFactory } from '../provider-factory';
import { ProviderNotConfiguredError } from '../errors/provider-not-configured.error';
import type { FiscalProvider } from '../../../shared/domain/fiscal-provider.interface';

function fakeProvider(): FiscalProvider {
  return {
    assertEnvironmentAvailable: jest.fn(),
    issue: jest.fn(),
    cancel: jest.fn(),
    consult: jest.fn(),
    correctionLetter: jest.fn(),
    inutilize: jest.fn(),
  };
}

describe('FiscalProviderFactory', () => {
  it('resolves a registered SEFAZ_BA_NFE provider', () => {
    const factory = new FiscalProviderFactory();
    const provider = fakeProvider();

    factory.register('SEFAZ_BA_NFE', provider);

    expect(factory.getProvider('SEFAZ_BA_NFE')).toBe(provider);
  });

  it('resolves a registered SEFIN_NACIONAL provider independently', () => {
    const factory = new FiscalProviderFactory();
    const nfeProvider = fakeProvider();
    const nfseProvider = fakeProvider();

    factory.register('SEFAZ_BA_NFE', nfeProvider);
    factory.register('SEFIN_NACIONAL', nfseProvider);

    expect(factory.getProvider('SEFIN_NACIONAL')).toBe(nfseProvider);
    expect(factory.getProvider('SEFAZ_BA_NFE')).toBe(nfeProvider);
  });

  it('throws ProviderNotConfiguredError for an unregistered provider type', () => {
    const factory = new FiscalProviderFactory();

    expect(() => factory.getProvider('SEFAZ_BA_NFE')).toThrow(
      ProviderNotConfiguredError,
    );
  });

  it('reports whether a provider type is registered', () => {
    const factory = new FiscalProviderFactory();

    expect(factory.isRegistered('SEFAZ_BA_NFE')).toBe(false);

    factory.register('SEFAZ_BA_NFE', fakeProvider());

    expect(factory.isRegistered('SEFAZ_BA_NFE')).toBe(true);
  });
});
