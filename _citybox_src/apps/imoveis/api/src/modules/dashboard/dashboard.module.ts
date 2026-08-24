import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { GetDashboardOverviewUseCase } from './application/use-cases/get-dashboard-overview/get-dashboard-overview.use-case';
import { GetDashboardOverviewRoute } from './infrastructure/http/routes/get-dashboard-overview/get-dashboard-overview.route';

@Module({
  imports: [
    TransactionsModule,
    LeadsModule,
    PropertiesModule,
    AppointmentsModule,
  ],
  controllers: [GetDashboardOverviewRoute],
  providers: [GetDashboardOverviewUseCase],
})
export class DashboardModule {}
