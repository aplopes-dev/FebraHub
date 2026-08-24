import { Module } from '@nestjs/common';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { StorageModule } from '../../shared/infra/storage/storage.module';
import { FiscalDocumentRepository } from '../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { ObjectStorage } from '../../shared/domain/storage/object-storage.interface';
import { WatermarkStamper } from './domain/watermark.interface';
import { PdfLibWatermarkStamper } from './infrastructure/pdf/pdf-lib-watermark.stamper';
import { DanfeRenderer } from './infrastructure/pdf/danfe.renderer';
import { DanfseRenderer } from './infrastructure/pdf/danfse.renderer';
import { DanfeNfceRenderer } from './infrastructure/pdf/danfe-nfce.renderer';
import { DanfceA4Renderer } from './infrastructure/pdf/danfce-a4.renderer';
import { OfficialDanfseSource } from './infrastructure/sefin/official-danfse.source';
import { OfficialDanfseClient } from './infrastructure/sefin/official-danfse.client';
import { NoOfficialSource } from './domain/official-source.interface';
import { CompanyAccessPolicy } from '../../shared/domain/tenant/company-access.policy';
import { TenantAccessModule } from '../../shared/infra/tenant/tenant-access.module';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import {
  GetAuxiliaryDocumentUseCase,
  RENDERER_REGISTRY,
  OFFICIAL_SOURCE_REGISTRY,
  type RendererRegistry,
  type OfficialSourceRegistry,
} from './application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case';

/// Documento auxiliar impresso (DANFE / DANFSE).
///
/// Módulo compartilhado: concentra domínio e renderização, enquanto as **rotas
/// vivem em `NfeModule` e `NfseModule`**. A separação é deliberada — quem
/// procura o que dá para fazer com uma NF-e encontra tudo sob o mesmo prefixo e
/// a mesma tag do Swagger, sem que a lógica compartilhada precise ser
/// duplicada nos dois lados.
///
/// Fase 1 entregou o DANFE; a Fase 2 acrescentou o DANFSE, com preferência
/// pela API oficial do Sefin quando ela estiver disponível (FR-002a).
@Module({
  imports: [
    FiscalDocumentsModule,
    CertificatesModule,
    StorageModule,
    PrismaModule,
    // Autorização por Emitente saiu deste módulo na spec 005 — ver
    // `TenantAccessModule` para o porquê.
    TenantAccessModule,
  ],
  providers: [
    DanfeRenderer,
    DanfseRenderer,
    DanfeNfceRenderer,
    DanfceA4Renderer,
    OfficialDanfseClient,
    OfficialDanfseSource,
    { provide: WatermarkStamper, useClass: PdfLibWatermarkStamper },
    {
      provide: RENDERER_REGISTRY,
      useFactory: (
        danfe: DanfeRenderer,
        danfse: DanfseRenderer,
        danfceBobina: DanfeNfceRenderer,
        danfceA4: DanfceA4Renderer,
      ): RendererRegistry => ({
        // NF-e e NFS-e têm um leiaute só: pedir `A4` nelas não muda nada, e
        // apontar os dois formatos para o mesmo renderizador diz isso de forma
        // explícita — melhor que uma entrada ausente ou um erro artificial.
        NFE: { DEFAULT: danfe, A4: danfe },
        NFSE: { DEFAULT: danfse, A4: danfse },
        // O cupom é o único com dois leiautes de verdade. `DEFAULT` é a
        // **bobina**, porque é o formato oficial da NFC-e e o que sai na
        // impressora do caixa; o A4 é a via para guardar e reenviar (FR-007a).
        NFCE: { DEFAULT: danfceBobina, A4: danfceA4 },
      }),
      inject: [
        DanfeRenderer,
        DanfseRenderer,
        DanfeNfceRenderer,
        DanfceA4Renderer,
      ],
    },
    {
      provide: OFFICIAL_SOURCE_REGISTRY,
      // `NFE` nunca tem fonte oficial: a SEFAZ não fornece DANFE pronto — o
      // emitente é quem gera. Não é lacuna a preencher, é como o documento
      // funciona.
      useFactory: (danfse: OfficialDanfseSource): OfficialSourceRegistry => ({
        NFE: new NoOfficialSource(),
        NFSE: danfse,
        // Como a NF-e: a SEFAZ não fornece DANFE NFC-e pronto.
        NFCE: new NoOfficialSource(),
      }),
      inject: [OfficialDanfseSource],
    },
    {
      provide: GetAuxiliaryDocumentUseCase,
      useFactory: (
        repository: FiscalDocumentRepository,
        storage: ObjectStorage,
        renderers: RendererRegistry,
        stamper: WatermarkStamper,
        officialSources: OfficialSourceRegistry,
        events: FiscalEventRepository,
        accessPolicy: CompanyAccessPolicy,
      ) =>
        new GetAuxiliaryDocumentUseCase(
          repository,
          storage,
          renderers,
          stamper,
          officialSources,
          events,
          accessPolicy,
        ),
      inject: [
        FiscalDocumentRepository,
        ObjectStorage,
        RENDERER_REGISTRY,
        WatermarkStamper,
        OFFICIAL_SOURCE_REGISTRY,
        FiscalEventRepository,
        CompanyAccessPolicy,
      ],
    },
  ],
  // `CompanyAccessPolicy` exportada na spec 005: `IssueNfceUseCase` a usa para
  // decidir se o solicitante pode emitir pelo Emitente afirmado no header. Sem
  // o export, o container não sobe — e o typecheck não diz nada.
  exports: [GetAuxiliaryDocumentUseCase],
})
export class AuxiliaryDocumentsModule {}
