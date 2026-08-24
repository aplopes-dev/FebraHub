import { Module, OnModuleInit } from '@nestjs/common';
import { CertificatesModule } from '../../certificates/certificates.module';
import { FiscalDocumentsModule } from '../../fiscal-documents/fiscal-documents.module';
import { FiscalProviderFactory } from '../provider-factory';
import { SefinNacionalNfseProvider } from './infrastructure/sefin-nacional-nfse.provider';

/// Registra o provider do Sistema Nacional no `FiscalProviderFactory`
/// (Strategy) — mesmo padrão de `SefazBaModule`.
///
/// Os imports não são decorativos: o provider recarrega o `FiscalDocument` por
/// id e resolve o certificado do Emitente. `ObjectStorage` vem do
/// `StorageModule`, que é `@Global`.
@Module({
  imports: [CertificatesModule, FiscalDocumentsModule],
  providers: [SefinNacionalNfseProvider],
  // Exportado porque `ListNfseEventsUseCase` depende de `syncEvents`, que e
  // capacidade especifica deste provider e nao esta em `FiscalProvider` — a
  // alternativa seria resolver pela factory e fazer cast, trocando uma
  // dependencia explicita por uma escondida.
  exports: [SefinNacionalNfseProvider],
})
export class SefinNacionalModule implements OnModuleInit {
  constructor(
    private readonly providerFactory: FiscalProviderFactory,
    private readonly sefinNacionalNfseProvider: SefinNacionalNfseProvider,
  ) {}

  onModuleInit(): void {
    this.providerFactory.register(
      'SEFIN_NACIONAL',
      this.sefinNacionalNfseProvider,
    );
  }
}
