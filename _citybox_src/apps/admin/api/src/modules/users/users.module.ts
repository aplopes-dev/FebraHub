import { Module } from '@nestjs/common';
import { ListUsersRoute } from './infrastructure/http/routes/list-users/list-users.route';
import { FindUserByIdRoute } from './infrastructure/http/routes/find-user-by-id/find-user-by-id.route';
import { CreateUserRoute } from './infrastructure/http/routes/create-user/create-user.route';
import { UpdateUserRoute } from './infrastructure/http/routes/update-user/update-user.route';
import { DeleteUserRoute } from './infrastructure/http/routes/delete-user/delete-user.route';
import { ResendInviteRoute } from './infrastructure/http/routes/resend-invite/resend-invite.route';
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id/find-user-by-id.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user/delete-user.use-case';
import { ResendInviteUseCase } from './application/use-cases/resend-invite/resend-invite.use-case';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { KeycloakUserAdapter } from './infrastructure/keycloak/keycloak-user.adapter';
import { UserRepository } from './domain/repositories/user.repository.interface';
import { KeycloakUserProvider } from './domain/keycloak/keycloak-user.provider.interface';
import { KeycloakAdminService } from '../../shared/infra/keycloak/keycloak-admin.service';

@Module({
  controllers: [
    ListUsersRoute,
    FindUserByIdRoute,
    CreateUserRoute,
    UpdateUserRoute,
    DeleteUserRoute,
    ResendInviteRoute,
  ],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: KeycloakUserProvider, useClass: KeycloakUserAdapter },
    KeycloakAdminService,
    ListUsersUseCase,
    FindUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ResendInviteUseCase,
  ],
})
export class UsersModule {}
