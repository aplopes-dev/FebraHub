import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { CreatePosCustomerRoute } from './infrastructure/http/routes/create-pos-customer/create-pos-customer.route';
import { FindPosCustomerByIdRoute } from './infrastructure/http/routes/find-pos-customer-by-id/find-pos-customer-by-id.route';
import { ListPosCustomerCategoriesRoute } from './infrastructure/http/routes/list-pos-customer-categories/list-pos-customer-categories.route';
import { ListPosCustomersRoute } from './infrastructure/http/routes/list-pos-customers/list-pos-customers.route';

@Module({
  // Customers exporta use cases CRM; PosTerminals exporta DeviceAuthGuard.
  imports: [CustomersModule, PosTerminalsModule],
  controllers: [
    ListPosCustomersRoute,
    CreatePosCustomerRoute,
    FindPosCustomerByIdRoute,
    ListPosCustomerCategoriesRoute,
  ],
})
export class PosCustomersModule {}
