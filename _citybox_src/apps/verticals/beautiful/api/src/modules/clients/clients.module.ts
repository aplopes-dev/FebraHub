import { Module } from '@nestjs/common';
import { ClientCategoriesModule } from '../client-categories/client-categories.module';
import { CreateClientRoute } from './infrastructure/http/routes/create-client/create-client.route';
import { ListClientsRoute } from './infrastructure/http/routes/list-clients/list-clients.route';
import { GetClientByIdRoute } from './infrastructure/http/routes/get-client-by-id/get-client-by-id.route';
import { UpdateClientRoute } from './infrastructure/http/routes/update-client/update-client.route';
import { DeleteClientRoute } from './infrastructure/http/routes/delete-client/delete-client.route';

import { CreateClientUseCase } from './application/use-cases/create-client/create-client.use-case';
import { ListClientsUseCase } from './application/use-cases/list-clients/list-clients.use-case';
import { GetClientByIdUseCase } from './application/use-cases/get-client-by-id/get-client-by-id.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client/delete-client.use-case';

import { PrismaClientRepository } from './infrastructure/database/prisma-client.repository';
import { ClientRepository } from './domain/repositories/client.repository.interface';

@Module({
  imports: [ClientCategoriesModule],
  controllers: [
    CreateClientRoute,
    ListClientsRoute,
    GetClientByIdRoute,
    UpdateClientRoute,
    DeleteClientRoute,
  ],
  providers: [
    {
      provide: ClientRepository,
      useClass: PrismaClientRepository,
    },
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
  exports: [ClientRepository],
})
export class ClientsModule {}
