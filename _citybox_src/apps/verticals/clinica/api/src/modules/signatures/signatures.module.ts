import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { PatientAnamnesesModule } from '../patients/patient-anamneses/patient-anamneses.module';
import { PatientContractEmissionsModule } from '../patients/patient-contract-emissions/patient-contract-emissions.module';
import { TreatmentEvolutionsModule } from '../patients/treatment-evolutions/treatment-evolutions.module';
import { SignaturePackagesModule } from '../signature-packages/signature-packages.module';
import { ElectronicSignatureRepository } from './domain/repositories/electronic-signature.repository.interface';
import { ZapSignClient } from './domain/zapsign/zapsign-client.interface';
import { PrismaElectronicSignatureRepository } from './infrastructure/database/prisma-electronic-signature.repository';
import { HttpZapSignClient } from './infrastructure/zapsign/http-zapsign.client';
import { RequestAnamnesisSignatureUseCase } from './application/use-cases/request-anamnesis-signature/request-anamnesis-signature.use-case';
import { RequestContractSignatureUseCase } from './application/use-cases/request-contract-signature/request-contract-signature.use-case';
import { RequestEvolutionBatchSignatureUseCase } from './application/use-cases/request-evolution-batch-signature/request-evolution-batch-signature.use-case';
import { GetElectronicSignatureUseCase } from './application/use-cases/get-electronic-signature/get-electronic-signature.use-case';
import { GetSignatureByTargetUseCase } from './application/use-cases/get-signature-by-target/get-signature-by-target.use-case';
import { CancelElectronicSignatureUseCase } from './application/use-cases/cancel-electronic-signature/cancel-electronic-signature.use-case';
import { GetSignedPdfUseCase } from './application/use-cases/get-signed-pdf/get-signed-pdf.use-case';
import { HandleZapSignWebhookUseCase } from './application/use-cases/handle-zapsign-webhook/handle-zapsign-webhook.use-case';
import { ListElectronicSignaturesUseCase } from './application/use-cases/list-electronic-signatures/list-electronic-signatures.use-case';
import { ListPatientSignaturesUseCase } from './application/use-cases/list-patient-signatures/list-patient-signatures.use-case';
import { RequestAnamnesisSignatureRoute } from './infrastructure/http/routes/request-anamnesis-signature/request-anamnesis-signature.route';
import { RequestContractSignatureRoute } from './infrastructure/http/routes/request-contract-signature/request-contract-signature.route';
import { RequestEvolutionBatchSignatureRoute } from './infrastructure/http/routes/request-evolution-batch-signature/request-evolution-batch-signature.route';
import { GetSignatureByTargetRoute } from './infrastructure/http/routes/get-signature-by-target/get-signature-by-target.route';
import { ListPatientSignaturesRoute } from './infrastructure/http/routes/list-patient-signatures/list-patient-signatures.route';
import { GetElectronicSignatureRoute } from './infrastructure/http/routes/get-electronic-signature/get-electronic-signature.route';
import { CancelElectronicSignatureRoute } from './infrastructure/http/routes/cancel-electronic-signature/cancel-electronic-signature.route';
import { GetSignedPdfRoute } from './infrastructure/http/routes/get-signed-pdf/get-signed-pdf.route';
import { ListElectronicSignaturesRoute } from './infrastructure/http/routes/list-electronic-signatures/list-electronic-signatures.route';
import { ZapSignWebhookRoute } from './infrastructure/http/routes/zapsign-webhook/zapsign-webhook.route';

@Module({
  imports: [
    forwardRef(() => PatientsModule),
    forwardRef(() => PatientAnamnesesModule),
    forwardRef(() => PatientContractEmissionsModule),
    forwardRef(() => TreatmentEvolutionsModule),
    SignaturePackagesModule,
  ],
  controllers: [
    RequestAnamnesisSignatureRoute,
    RequestContractSignatureRoute,
    RequestEvolutionBatchSignatureRoute,
    GetSignatureByTargetRoute,
    // List `@Get()` before `@Get(':signatureId')` so Nest does not treat "" as id.
    ListPatientSignaturesRoute,
    GetElectronicSignatureRoute,
    CancelElectronicSignatureRoute,
    GetSignedPdfRoute,
    ListElectronicSignaturesRoute,
    ZapSignWebhookRoute,
  ],
  providers: [
    {
      provide: ElectronicSignatureRepository,
      useClass: PrismaElectronicSignatureRepository,
    },
    { provide: ZapSignClient, useClass: HttpZapSignClient },
    RequestAnamnesisSignatureUseCase,
    RequestContractSignatureUseCase,
    RequestEvolutionBatchSignatureUseCase,
    GetElectronicSignatureUseCase,
    GetSignatureByTargetUseCase,
    CancelElectronicSignatureUseCase,
    GetSignedPdfUseCase,
    HandleZapSignWebhookUseCase,
    ListElectronicSignaturesUseCase,
    ListPatientSignaturesUseCase,
  ],
})
export class SignaturesModule {}
