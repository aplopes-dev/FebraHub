import { Global, Module } from '@nestjs/common';
import { FiscalProviderFactory } from './provider-factory';

/// Global: nfe/nfse (fases futuras) injetam o mesmo FiscalProviderFactory para
/// registrar seus providers concretos, sem precisar reimportar este módulo.
@Global()
@Module({
  providers: [FiscalProviderFactory],
  exports: [FiscalProviderFactory],
})
export class ProvidersModule {}
