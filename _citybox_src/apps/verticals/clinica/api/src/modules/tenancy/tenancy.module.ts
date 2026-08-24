import { Module } from '@nestjs/common';
import { CreateClinicUseCase } from './application/use-cases/create-clinic.use-case';
import { ListClinicsUseCase } from './application/use-cases/list-clinics.use-case';
import {
  ClinicRepository,
  OrganizationRepository,
} from './domain/repositories/tenancy.repositories';
import {
  PrismaClinicRepository,
  PrismaOrganizationRepository,
} from './infrastructure/database/prisma-tenancy.repositories';
import { ClinicsRoute } from './infrastructure/http/routes/clinics.route';

/**
 * Tenancy da vertical: Organization (1:1 com a Store do platform) e Clinic (1..N).
 * Exporta os repositórios porque o worker (Fase 5) e o guard de escopo (Fase 6) dependem deles.
 */
@Module({
  controllers: [ClinicsRoute],
  providers: [
    { provide: OrganizationRepository, useClass: PrismaOrganizationRepository },
    { provide: ClinicRepository, useClass: PrismaClinicRepository },
    ListClinicsUseCase,
    CreateClinicUseCase,
  ],
  exports: [OrganizationRepository, ClinicRepository],
})
export class TenancyModule {}
