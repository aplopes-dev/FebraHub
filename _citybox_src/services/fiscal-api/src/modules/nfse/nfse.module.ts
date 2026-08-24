import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { NfeModule } from '../nfe/nfe.module';
import { SefinNacionalModule } from '../providers/sefin-nacional/sefin-nacional.module';
import { AuxiliaryDocumentsModule } from '../auxiliary-documents/auxiliary-documents.module';
import { IssueNfseRoute } from './infrastructure/http/routes/issue-nfse/issue-nfse.route';
import { GetNfseRoute } from './infrastructure/http/routes/get-nfse/get-nfse.route';
import { GetNfseXmlRoute } from './infrastructure/http/routes/get-nfse-xml/get-nfse-xml.route';
import { GetDanfseRoute } from './infrastructure/http/routes/get-danfse/get-danfse.route';
import { CancelNfseRoute } from './infrastructure/http/routes/cancel-nfse/cancel-nfse.route';
import { SubstituteNfseRoute } from './infrastructure/http/routes/substitute-nfse/substitute-nfse.route';
import { ListNfseEventsRoute } from './infrastructure/http/routes/list-nfse-events/list-nfse-events.route';
import { ListNfseEventsUseCase } from './application/use-cases/list-nfse-events/list-nfse-events.use-case';
import { IssueNfseUseCase } from './application/use-cases/issue-nfse/issue-nfse.use-case';
import { CancelNfseUseCase } from './application/use-cases/cancel-nfse/cancel-nfse.use-case';
import { SubstituteNfseUseCase } from './application/use-cases/substitute-nfse/substitute-nfse.use-case';
import { MunicipalParametersService } from './application/services/municipal-parameters.service';
import { MunicipalParametersRepository } from './domain/repositories/municipal-parameters.repository.interface';
import { PrismaMunicipalParametersRepository } from './infrastructure/database/prisma-municipal-parameters.repository';

/// US2 (P2) + US4/T067 (cancelamento) — emitir/consultar/baixar XML/
/// cancelar NFS-e (Padrão Nacional, piloto Ilhéus/BA). Reaproveita
/// `ConsultNfeUseCase`/`GetNfeXmlUseCase` de `NfeModule` (genéricos por
/// `FiscalDocument`, sem nada específico de NF-e — ver comentário nas
/// rotas `GetNfseRoute`/`GetNfseXmlRoute`); `CancelNfseUseCase` é próprio
/// (mesma lógica de `CancelNfeUseCase`, duplicado deliberadamente — ver
/// comentário no use-case).
///
/// `SefinNacionalModule` registra o provider do **Sistema Nacional** — Ilhéus
/// aderiu ao padrão nacional (Decreto Municipal nº 220/2026), tornando o
/// provider municipal obsoleto. A emissão transmite de verdade; `cancel`
/// ainda responde 501 porque no padrão nacional cancelamento é um EVENTO
/// contra a chave de acesso, implementado na fase de US2.
@Module({
  imports: [
    CompaniesModule,
    CertificatesModule,
    FiscalDocumentsModule,
    NfeModule,
    SefinNacionalModule,
    AuxiliaryDocumentsModule,
  ],
  controllers: [
    IssueNfseRoute,
    GetNfseRoute,
    GetNfseXmlRoute,
    GetDanfseRoute,
    CancelNfseRoute,
    SubstituteNfseRoute,
    ListNfseEventsRoute,
  ],
  providers: [
    IssueNfseUseCase,
    CancelNfseUseCase,
    SubstituteNfseUseCase,
    ListNfseEventsUseCase,
    // O cancelamento le o prazo publicado pelo municipio (FR-012); sem estes
    // dois a decisao direto-vs-analise-fiscal nao tem de onde sair.
    MunicipalParametersService,
    {
      provide: MunicipalParametersRepository,
      useClass: PrismaMunicipalParametersRepository,
    },
  ],
})
export class NfseModule {}
