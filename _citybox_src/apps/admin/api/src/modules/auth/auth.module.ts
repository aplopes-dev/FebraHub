import { Module } from '@nestjs/common';
import { GetPermissionsRoute } from './infrastructure/http/routes/get-permissions/get-permissions.route';

@Module({
  controllers: [GetPermissionsRoute],
})
export class AuthModule {}
