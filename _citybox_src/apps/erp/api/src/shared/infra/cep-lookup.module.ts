import { Module } from '@nestjs/common';
import { PosTerminalsModule } from '../../modules/pos-terminals/pos-terminals.module';
import { LookupCepUseCase } from '../application/use-cases/lookup-cep/lookup-cep.use-case';
import { CepProviderModule } from './providers/cep/cep-provider.module';
import { LookupCepRoute } from './http/routes/lookup-cep/lookup-cep.route';
import { LookupPosCepRoute } from './http/routes/lookup-cep/lookup-pos-cep.route';

@Module({
  imports: [CepProviderModule, PosTerminalsModule],
  providers: [LookupCepUseCase],
  controllers: [LookupCepRoute, LookupPosCepRoute],
})
export class CepLookupModule {}
