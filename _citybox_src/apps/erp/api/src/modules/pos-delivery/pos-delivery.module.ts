import { Module } from '@nestjs/common';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import {
  CreatePosDeliveryOrderUseCase,
  GetPosDeliveryOrderUseCase,
  ListPosCouriersUseCase,
  ListPosDeliveryOrdersUseCase,
  ReplacePosDeliveryOrderLinesUseCase,
  UpdatePosDeliveryOrderStatusUseCase,
  UpdatePosDeliveryOrderUseCase,
} from './application/use-cases/pos-delivery.use-cases';
import { PosDeliveryOrderRepository } from './domain/repositories/pos-delivery-order.repository.interface';
import { PrismaPosDeliveryOrderRepository } from './infrastructure/database/prisma-pos-delivery-order.repository';
import { PosDeliveryController } from './infrastructure/http/pos-delivery.controller';

const useCases = [
  CreatePosDeliveryOrderUseCase,
  ListPosDeliveryOrdersUseCase,
  GetPosDeliveryOrderUseCase,
  UpdatePosDeliveryOrderUseCase,
  ReplacePosDeliveryOrderLinesUseCase,
  UpdatePosDeliveryOrderStatusUseCase,
  ListPosCouriersUseCase,
];

@Module({
  // PosTerminals exporta DeviceAuthGuard + PosTerminalRepository.
  imports: [PosTerminalsModule],
  controllers: [PosDeliveryController],
  providers: [
    {
      provide: PosDeliveryOrderRepository,
      useClass: PrismaPosDeliveryOrderRepository,
    },
    ...useCases,
  ],
  exports: [PosDeliveryOrderRepository, ...useCases],
})
export class PosDeliveryModule {}
