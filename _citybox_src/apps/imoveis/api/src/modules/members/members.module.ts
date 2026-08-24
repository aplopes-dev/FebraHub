import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { GetMyAccessUseCase } from './application/use-cases/get-my-access.use-case';
import { MembersRoute } from './infrastructure/http/routes/members.route';

@Module({
  imports: [SettingsModule],
  controllers: [MembersRoute],
  providers: [GetMyAccessUseCase],
})
export class MembersModule {}
