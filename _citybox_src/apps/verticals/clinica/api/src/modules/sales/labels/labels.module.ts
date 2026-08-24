import { Module } from '@nestjs/common';

import { CreateSalesLabelUseCase } from './application/use-cases/create-sales-label/create-sales-label.use-case';
import { DeleteSalesLabelUseCase } from './application/use-cases/delete-sales-label/delete-sales-label.use-case';
import { ListSalesLabelsUseCase } from './application/use-cases/list-sales-labels/list-sales-labels.use-case';
import { UpdateSalesLabelUseCase } from './application/use-cases/update-sales-label/update-sales-label.use-case';
import { SalesLabelRepository } from './domain/repositories/sales-label.repository';
import { PrismaSalesLabelRepository } from './infrastructure/database/prisma-sales-label.repository';
import { SalesLabelsRoute } from './infrastructure/http/routes/sales-labels.route';

@Module({
  controllers: [SalesLabelsRoute],
  providers: [
    { provide: SalesLabelRepository, useClass: PrismaSalesLabelRepository },
    ListSalesLabelsUseCase,
    CreateSalesLabelUseCase,
    UpdateSalesLabelUseCase,
    DeleteSalesLabelUseCase,
  ],
  exports: [SalesLabelRepository],
})
export class SalesLabelsModule {}
