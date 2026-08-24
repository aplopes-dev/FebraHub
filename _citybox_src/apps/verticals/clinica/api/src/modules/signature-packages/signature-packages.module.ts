import { Module } from '@nestjs/common';

import { SignatureCreditBalanceRepository } from './domain/repositories/signature-credit-balance.repository.interface';
import { SignaturePackageRequestRepository } from './domain/repositories/signature-package-request.repository.interface';
import { PrismaSignatureCreditBalanceRepository } from './infrastructure/database/prisma-signature-credit-balance.repository';
import { PrismaSignaturePackageRequestRepository } from './infrastructure/database/prisma-signature-package-request.repository';

import { GetSignatureCreditsUseCase } from './application/use-cases/get-signature-credits/get-signature-credits.use-case';
import { ListSignaturePackageRequestsUseCase } from './application/use-cases/list-signature-package-requests/list-signature-package-requests.use-case';
import { CreateSignaturePackageRequestUseCase } from './application/use-cases/create-signature-package-request/create-signature-package-request.use-case';
import { LiberateSignaturePackageRequestUseCase } from './application/use-cases/liberate-signature-package-request/liberate-signature-package-request.use-case';
import { CancelSignaturePackageRequestUseCase } from './application/use-cases/cancel-signature-package-request/cancel-signature-package-request.use-case';
import { ConsumeSignatureCreditService } from './application/services/consume-signature-credit.service';

import { GetSignatureCreditsRoute } from './infrastructure/http/routes/get-signature-credits/get-signature-credits.route';
import { ListSignaturePackageRequestsRoute } from './infrastructure/http/routes/list-signature-package-requests/list-signature-package-requests.route';
import { CreateSignaturePackageRequestRoute } from './infrastructure/http/routes/create-signature-package-request/create-signature-package-request.route';
import { LiberateSignaturePackageRequestRoute } from './infrastructure/http/routes/liberate-signature-package-request/liberate-signature-package-request.route';
import { CancelSignaturePackageRequestRoute } from './infrastructure/http/routes/cancel-signature-package-request/cancel-signature-package-request.route';

@Module({
  controllers: [
    GetSignatureCreditsRoute,
    ListSignaturePackageRequestsRoute,
    CreateSignaturePackageRequestRoute,
    LiberateSignaturePackageRequestRoute,
    CancelSignaturePackageRequestRoute,
  ],
  providers: [
    {
      provide: SignatureCreditBalanceRepository,
      useClass: PrismaSignatureCreditBalanceRepository,
    },
    {
      provide: SignaturePackageRequestRepository,
      useClass: PrismaSignaturePackageRequestRepository,
    },
    GetSignatureCreditsUseCase,
    ListSignaturePackageRequestsUseCase,
    CreateSignaturePackageRequestUseCase,
    LiberateSignaturePackageRequestUseCase,
    CancelSignaturePackageRequestUseCase,
    ConsumeSignatureCreditService,
  ],
  exports: [
    SignatureCreditBalanceRepository,
    SignaturePackageRequestRepository,
    ConsumeSignatureCreditService,
  ],
})
export class SignaturePackagesModule {}
