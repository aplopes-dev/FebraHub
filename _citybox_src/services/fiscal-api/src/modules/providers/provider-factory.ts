import { Injectable } from '@nestjs/common';
import type {
  FiscalProvider,
  FiscalProviderType,
} from '../../shared/domain/fiscal-provider.interface';
import { ProviderNotConfiguredError } from './errors/provider-not-configured.error';

/// Strategy Factory (Provider Pattern) — resolve o FiscalProvider correto por
/// tipo. Providers concretos (SefazBaNfeProvider, SefinNacionalNfseProvider)
/// se registram aqui no `onModuleInit` do próprio módulo (nfe/nfse — user
/// stories futuras), em vez de serem construídos diretamente pela factory —
/// isso mantém este módulo Foundational sem depender de código de nfe/nfse.
@Injectable()
export class FiscalProviderFactory {
  private readonly registry = new Map<FiscalProviderType, FiscalProvider>();

  register(type: FiscalProviderType, provider: FiscalProvider): void {
    this.registry.set(type, provider);
  }

  getProvider(type: FiscalProviderType): FiscalProvider {
    const provider = this.registry.get(type);
    if (!provider) {
      throw new ProviderNotConfiguredError(FiscalProviderFactory.name, type);
    }
    return provider;
  }

  isRegistered(type: FiscalProviderType): boolean {
    return this.registry.has(type);
  }
}
