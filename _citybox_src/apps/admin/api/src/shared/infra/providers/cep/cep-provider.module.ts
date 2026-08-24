import { Module } from '@nestjs/common';
import { ICepProvider } from '../../../domain/providers/cep.provider.interface';
import { BrasilApiCepProvider } from './brasil-api-cep.provider';

@Module({
  providers: [
    {
      provide: ICepProvider,
      useClass: BrasilApiCepProvider,
    },
  ],
  exports: [ICepProvider],
})
export class CepProviderModule {}
