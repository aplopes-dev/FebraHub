import { Module } from '@nestjs/common';
import { ComercialController } from './comercial.controller';
import { ComercialService } from './comercial.service';

/**
 * Módulo Comercial — CRM de vendas.
 *
 * PrismaService é global (DatabaseModule @Global) — não precisa importar.
 */
@Module({
  controllers: [ComercialController],
  providers: [ComercialService],
  exports: [ComercialService],
})
export class ComercialModule {}
