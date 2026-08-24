import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { SefazBaModule } from '../providers/sefaz-ba/sefaz-ba.module';
import { NfeModule } from '../nfe/nfe.module';
import { AuxiliaryDocumentsModule } from '../auxiliary-documents/auxiliary-documents.module';
import { IssueNfceRoute } from './infrastructure/http/routes/issue-nfce/issue-nfce.route';
import { GetNfceRoute } from './infrastructure/http/routes/get-nfce/get-nfce.route';
import { GetNfceXmlRoute } from './infrastructure/http/routes/get-nfce-xml/get-nfce-xml.route';
import { GetDanfceRoute } from './infrastructure/http/routes/get-danfce/get-danfce.route';
import { CancelNfceRoute } from './infrastructure/http/routes/cancel-nfce/cancel-nfce.route';
import { InutilizeNfceRoute } from './infrastructure/http/routes/inutilize-nfce/inutilize-nfce.route';
import { IssueNfceUseCase } from './application/use-cases/issue-nfce/issue-nfce.use-case';
import { TransmitPendingNfceUseCase } from './application/use-cases/transmit-pending-nfce/transmit-pending-nfce.use-case';
import { AlertOverdueContingencyUseCase } from './application/use-cases/alert-overdue-contingency/alert-overdue-contingency.use-case';
import { ContingencyQueueRepository } from './domain/contingency/contingency-queue.repository';
import { PrismaContingencyQueueRepository } from './infrastructure/contingency/prisma-contingency-queue.repository';
import { ContingencyScheduler } from './infrastructure/contingency/contingency.scheduler';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { TenantAccessModule } from '../../shared/infra/tenant/tenant-access.module';
import {
  NfceConsultationUrls,
  EnvNfceConsultationUrls,
} from './domain/consultation-urls';

/// US1 — emissão e consulta de cupom fiscal eletrônico (NFC-e, modelo 65).
///
/// `NfeModule` entra nos imports por `ConsultNfeUseCase`, que ele já exporta:
/// o caso de uso é genérico por `FiscalDocument` e não tem nada de modelo 55.
/// Duplicá-lo aqui criaria uma segunda máquina de estados para manter em
/// sincronia — o tipo de duplicação que só se descobre quebrada quando os dois
/// caminhos divergem.
///
/// `AuxiliaryDocumentsModule` fornece a `CompanyAccessPolicy` da feature 004,
/// que é quem decide se o solicitante pode agir pelo Emitente afirmado no
/// header.
@Module({
  imports: [
    CompaniesModule,
    CertificatesModule,
    FiscalDocumentsModule,
    SefazBaModule,
    AuxiliaryDocumentsModule,
    NfeModule,
    PrismaModule,
    TenantAccessModule,
  ],
  controllers: [
    IssueNfceRoute,
    GetNfceRoute,
    GetNfceXmlRoute,
    GetDanfceRoute,
    CancelNfceRoute,
    InutilizeNfceRoute,
  ],
  providers: [
    IssueNfceUseCase,
    // Implementação por ambiente. Sem URL configurada a emissão é recusada com
    // 424 — nunca um valor padrão, porque apontar para a UF errada produz
    // cupom autorizado com QR Code que leva a lugar nenhum.
    { provide: NfceConsultationUrls, useClass: EnvNfceConsultationUrls },
    {
      provide: ContingencyQueueRepository,
      useClass: PrismaContingencyQueueRepository,
    },
    TransmitPendingNfceUseCase,
    AlertOverdueContingencyUseCase,
    // Nasce DESLIGADO (`NFCE_CONTINGENCY_DRAIN=on` liga). Ver o comentário da
    // classe: com mais de uma réplica da API os drenos concorrem, e a fila
    // ainda não tem reivindicação atômica.
    ContingencyScheduler,
  ],
})
export class NfceModule {}
