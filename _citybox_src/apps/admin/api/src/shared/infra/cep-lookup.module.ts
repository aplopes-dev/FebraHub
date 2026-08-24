import { Module } from '@nestjs/common';
import { CepProviderModule } from './providers/cep/cep-provider.module';
import { LookupCepUseCase } from '../application/use-cases/lookup-cep/lookup-cep.use-case';
import { LookupCepRoute } from './http/routes/lookup-cep/lookup-cep.route';

@Module({
  imports: [CepProviderModule],
  providers: [LookupCepUseCase],
  controllers: [LookupCepRoute],
})
export class CepLookupModule {}
