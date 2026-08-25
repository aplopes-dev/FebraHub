import { Module } from '@nestjs/common';
import { CargosController } from './cargos.controller';
import { CargosService } from './cargos.service';
import { OrganogramaController } from './organograma.controller';
import { OrganogramaService } from './organograma.service';

@Module({
  controllers: [OrganogramaController, CargosController],
  providers: [OrganogramaService, CargosService],
})
export class OrganogramaModule {}
