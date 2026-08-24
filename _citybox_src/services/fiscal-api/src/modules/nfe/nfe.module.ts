import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { SefazBaModule } from '../providers/sefaz-ba/sefaz-ba.module';
import { AuxiliaryDocumentsModule } from '../auxiliary-documents/auxiliary-documents.module';
import { IssueNfeRoute } from './infrastructure/http/routes/issue-nfe/issue-nfe.route';
import { GetNfeRoute } from './infrastructure/http/routes/get-nfe/get-nfe.route';
import { GetNfeXmlRoute } from './infrastructure/http/routes/get-nfe-xml/get-nfe-xml.route';
import { GetDanfeRoute } from './infrastructure/http/routes/get-danfe/get-danfe.route';
import { CancelNfeRoute } from './infrastructure/http/routes/cancel-nfe/cancel-nfe.route';
import { CorrectionLetterNfeRoute } from './infrastructure/http/routes/correction-letter-nfe/correction-letter-nfe.route';
import { InutilizeNfeRoute } from './infrastructure/http/routes/inutilize-nfe/inutilize-nfe.route';
import { IssueNfeUseCase } from './application/use-cases/issue-nfe/issue-nfe.use-case';
import { ConsultNfeUseCase } from './application/use-cases/consult-nfe/consult-nfe.use-case';
import { GetNfeXmlUseCase } from './application/use-cases/get-nfe-xml/get-nfe-xml.use-case';
import { CancelNfeUseCase } from './application/use-cases/cancel-nfe/cancel-nfe.use-case';
import { CorrectionLetterNfeUseCase } from './application/use-cases/correction-letter-nfe/correction-letter-nfe.use-case';
import { InutilizeNfeUseCase } from './application/use-cases/inutilize-nfe/inutilize-nfe.use-case';

/// US1 (P1, MVP) + US4 completa para NF-e (cancelamento/carta de
/// correção/inutilização, T063–T066/T068) — emitir/consultar/baixar XML/
/// cancelar/corrigir/inutilizar NF-e. `SefazBaModule` (T038/T039/T068)
/// registra `SefazBaNfeProvider` no `FiscalProviderFactory` em
/// `onModuleInit` — chamadas reais de emissão/cancelamento/CC-e/inutilização
/// agora chegam de fato à SEFAZ-BA (homologação). Ver
/// `SefazBaNfeProvider`/`resources/wsdl/nfe/*.wsdl`/`nfe-soap-envelope.ts`
/// para as ressalvas sobre binding SOAP e XML de evento/inutilização
/// (autoria própria, não verificados contra as fontes oficiais — confirmar
/// antes do primeiro teste real). Cancelamento/inutilização de NFS-e
/// (T067/T069) ficam para uma entrega futura — sem bloqueio técnico, só
/// fora de escopo desta entrega (ver AGENTS.md).
@Module({
  imports: [
    CompaniesModule,
    CertificatesModule,
    FiscalDocumentsModule,
    SefazBaModule,
    AuxiliaryDocumentsModule,
  ],
  controllers: [
    IssueNfeRoute,
    GetNfeRoute,
    GetNfeXmlRoute,
    GetDanfeRoute,
    CancelNfeRoute,
    CorrectionLetterNfeRoute,
    InutilizeNfeRoute,
  ],
  providers: [
    IssueNfeUseCase,
    ConsultNfeUseCase,
    GetNfeXmlUseCase,
    CancelNfeUseCase,
    CorrectionLetterNfeUseCase,
    InutilizeNfeUseCase,
  ],
  // Casos de uso genéricos por FiscalDocument (sem nada específico do modelo
  // 55) — exportados para NfseModule e NfceModule reaproveitarem em vez de
  // duplicar. Cancelamento e inutilização entraram na spec 005: o primeiro
  // resolve prazo por `documentType` (24h/30min) e o segundo passou a receber
  // o tipo, que decide contra qual numeração operar.
  exports: [
    ConsultNfeUseCase,
    GetNfeXmlUseCase,
    CancelNfeUseCase,
    InutilizeNfeUseCase,
  ],
})
export class NfeModule {}
