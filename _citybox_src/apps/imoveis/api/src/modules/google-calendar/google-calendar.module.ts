import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { GoogleCalendarService } from './infrastructure/google-calendar.service';
import { GetGoogleCalendarAuthUrlUseCase } from './application/use-cases/get-google-calendar-auth-url/get-google-calendar-auth-url.use-case';
import { GetGoogleCalendarStatusUseCase } from './application/use-cases/get-google-calendar-status/get-google-calendar-status.use-case';
import { DisconnectGoogleCalendarUseCase } from './application/use-cases/disconnect-google-calendar/disconnect-google-calendar.use-case';
import { HandleGoogleCalendarCallbackUseCase } from './application/use-cases/handle-google-calendar-callback/handle-google-calendar-callback.use-case';
import { SyncPendingGoogleCalendarUseCase } from './application/use-cases/sync-pending-google-calendar/sync-pending-google-calendar.use-case';
import { GetGoogleCalendarAuthUrlRoute } from './infrastructure/http/routes/get-google-calendar-auth-url/get-google-calendar-auth-url.route';
import { GetGoogleCalendarStatusRoute } from './infrastructure/http/routes/get-google-calendar-status/get-google-calendar-status.route';
import { DisconnectGoogleCalendarRoute } from './infrastructure/http/routes/disconnect-google-calendar/disconnect-google-calendar.route';
import { HandleGoogleCalendarCallbackRoute } from './infrastructure/http/routes/handle-google-calendar-callback/handle-google-calendar-callback.route';
import { SyncPendingGoogleCalendarRoute } from './infrastructure/http/routes/sync-pending-google-calendar/sync-pending-google-calendar.route';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [
    GetGoogleCalendarStatusRoute,
    GetGoogleCalendarAuthUrlRoute,
    DisconnectGoogleCalendarRoute,
    HandleGoogleCalendarCallbackRoute,
    SyncPendingGoogleCalendarRoute,
  ],
  providers: [
    GoogleCalendarService,
    GetGoogleCalendarAuthUrlUseCase,
    GetGoogleCalendarStatusUseCase,
    DisconnectGoogleCalendarUseCase,
    HandleGoogleCalendarCallbackUseCase,
    SyncPendingGoogleCalendarUseCase,
  ],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
