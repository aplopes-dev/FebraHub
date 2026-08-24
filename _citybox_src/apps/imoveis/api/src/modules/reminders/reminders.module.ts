import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DealsModule } from '../deals/deals.module';
import { LeadsModule } from '../leads/leads.module';
import { SettingsModule } from '../settings/settings.module';
import { GetRemindersUseCase } from './application/use-cases/get-reminders/get-reminders.use-case';
import { GetRemindersRoute } from './infrastructure/http/routes/get-reminders/get-reminders.route';

@Module({
  imports: [LeadsModule, AppointmentsModule, DealsModule, SettingsModule],
  controllers: [GetRemindersRoute],
  providers: [GetRemindersUseCase],
})
export class RemindersModule {}
