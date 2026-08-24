import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { BalancesController, TransfersController } from './transfers.controller.js';
import { TransfersService } from './transfers.service.js';

@Module({
  imports: [AuditModule],
  controllers: [TransfersController, BalancesController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
