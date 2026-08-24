import { Module } from '@nestjs/common';
import { ClinicStoreRepository } from './domain/repositories/clinic-store.repository.interface';
import { PrismaClinicStoreRepository } from './infrastructure/database/prisma-clinic-store.repository';

@Module({
  providers: [
    { provide: ClinicStoreRepository, useClass: PrismaClinicStoreRepository },
  ],
  exports: [ClinicStoreRepository],
})
export class ClinicStorePersistenceModule {}
