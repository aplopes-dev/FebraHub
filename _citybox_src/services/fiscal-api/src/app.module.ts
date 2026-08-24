import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { StorageModule } from './shared/infra/storage/storage.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { FiscalDocumentsModule } from './modules/fiscal-documents/fiscal-documents.module';
import { NfeModule } from './modules/nfe/nfe.module';
import { NfceModule } from './modules/nfce/nfce.module';
import { NfseModule } from './modules/nfse/nfse.module';
import { SefazStatusModule } from './modules/sefaz-status/sefaz-status.module';
import { FiscalSequencesModule } from './modules/fiscal-sequences/fiscal-sequences.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    ProvidersModule,
    CompaniesModule,
    CertificatesModule,
    FiscalDocumentsModule,
    NfeModule,
    NfceModule,
    NfseModule,
    SefazStatusModule,
    FiscalSequencesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
