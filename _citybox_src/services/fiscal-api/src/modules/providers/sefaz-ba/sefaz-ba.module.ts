import { Module, OnModuleInit } from '@nestjs/common';
import { CertificatesModule } from '../../certificates/certificates.module';
import { CompaniesModule } from '../../companies/companies.module';
import { FiscalDocumentsModule } from '../../fiscal-documents/fiscal-documents.module';
import { FiscalProviderFactory } from '../provider-factory';
import { SefazBaNfeProvider } from './infrastructure/sefaz-ba-nfe.provider';

/// Registra `SefazBaNfeProvider` no `FiscalProviderFactory` (Strategy) em
/// `onModuleInit` — o próprio módulo, não a factory, é dono da decisão de
/// QUAL provider concreto existe para `SEFAZ_BA_NFE` (mesmo padrão já
/// documentado em `provider-factory.ts`). T038. `CompaniesModule` (T065) —
/// `inutilize()` carrega `Company` diretamente, sem `FiscalDocument`.
@Module({
  imports: [CertificatesModule, CompaniesModule, FiscalDocumentsModule],
  providers: [SefazBaNfeProvider],
})
export class SefazBaModule implements OnModuleInit {
  constructor(
    private readonly providerFactory: FiscalProviderFactory,
    private readonly sefazBaNfeProvider: SefazBaNfeProvider,
  ) {}

  onModuleInit(): void {
    this.providerFactory.register('SEFAZ_BA_NFE', this.sefazBaNfeProvider);
  }
}
