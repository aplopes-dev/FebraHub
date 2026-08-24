import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module.js';
import { KeycloakAdminService } from '../identity/keycloak-admin.service.js';
import { MinioService } from '../storage/minio.service.js';
import { ProfileRateLimitGuard } from './profile-rate-limit.guard.js';
import { UsersController } from './users.controller.js';
import { StoreAccessService } from './store-access.service.js';
import { UserStoreAssignmentsService } from './user-store-assignments.service.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PlatformModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserStoreAssignmentsService,
    StoreAccessService,
    KeycloakAdminService,
    MinioService,
    ProfileRateLimitGuard,
  ],
  exports: [UsersService, UserStoreAssignmentsService, StoreAccessService],
})
export class UsersModule {}
