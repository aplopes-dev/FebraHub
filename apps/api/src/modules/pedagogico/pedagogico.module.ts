import { Module } from '@nestjs/common';
import { PedagogicoController } from './pedagogico.controller';
import { PedagogicoService } from './pedagogico.service';

@Module({
  controllers: [PedagogicoController],
  providers: [PedagogicoService],
})
export class PedagogicoModule {}
