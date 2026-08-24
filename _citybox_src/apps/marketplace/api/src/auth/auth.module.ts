import { Global, Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from './auth.middleware.js';
import { AuthService } from './auth.service.js';

@Global()
@Module({
  imports: [PlatformModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthMiddleware],
  exports: [AuthService, AuthMiddleware],
})
export class AuthModule {}