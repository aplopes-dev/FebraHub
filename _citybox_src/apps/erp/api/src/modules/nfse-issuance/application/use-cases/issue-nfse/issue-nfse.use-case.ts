import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import { ResolveServiceIssqnUseCase } from '../../../../fiscal-defaults/application/use-cases/resolve-service-issqn/resolve-service-issqn.use-case';
import { NfseIssuance } from '../../../domain/entities/nfse-issuance.entity';
import { NfseIssuanceRepository } from '../../../domain/repositories/nfse-issuance.repository.interface';
import { FiscalApiClient } from '../../../domain/providers/fiscal-api-client.interface';
import { FiscalApiEmissionError } from '../../../domain/errors/fiscal-api-emission.error';
import type { IssueNfseInput } from '../../dtos/issue-nfse.dto';

const SOURCE_SYSTEM = 'erp';

/**
 * Emite uma NFS-e a partir do ERP (spec erp/018). Resolve o Grupo de ISSQN,
 * monta o `IssueNfseRequest` (a fiscal-api não conhece grupos), transmite e
 * registra o vínculo `NfseIssuance`. **Idempotente**: a mesma operação
 * (`externalReference`) não emite uma segunda nota.
 *
 * ⚠️ **Isolamento de tenant (CRITICAL fix):** o `companyId` (Emitente) é resolvido
 * pelo **CNPJ da própria organização**, nunca vindo do cliente — senão um tenant
 * poderia emitir sob o Emitente/certificado de outro informando o id dele.
 *
 * ⚠️ Não-regressão E0625: a alíquota (`issRate`) só vira `pAliq` no XML **com
 * retenção** — a regra vive no builder da fiscal-api; aqui repassamos o valor do
 * grupo e o `issWithheld` da tela.
 *
 * **Ambiente (spec erp/025, P2):** vem de `Company.defaultEnvironment`, nunca
 * fixo — antes esta use case sempre transmitia `HOMOLOGATION`, mesmo quando o
 * lojista tinha configurado `PRODUCTION` na tela de Configurações gerais (a
 * tela mentia sobre o que fazia). Hoje a plataforma só sustenta HOMOLOGATION
 * de verdade (endpoints de produção da SEFAZ/Sefin não configurados na infra
 * — ADR/decisão de produto existente, não mudada por esta spec); um Emitente
 * em `PRODUCTION` recusa aqui, antes de reservar `idempotencyKey` ou gravar
 * `NfseIssuance` — mesmo cuidado que a fiscal-api já tem em
 * `SefazEnvironmentNotConfiguredError` (424), só que um passo antes, sem
 * round-trip fadado a falhar.
 */
@Injectable()
export class IssueNfseUseCase implements IUseCase<
  IssueNfseInput,
  NfseIssuance
> {
  constructor(
    private readonly repository: NfseIssuanceRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly resolveServiceIssqn: ResolveServiceIssqnUseCase,
    private readonly fiscalApiClient: FiscalApiClient,
  ) {}

  async execute(input: IssueNfseInput): Promise<NfseIssuance> {
    const idempotencyKey = input.externalReference;

    // Idempotência local: se a operação já foi emitida, devolve o vínculo
    // existente em vez de emitir de novo.
    const existing = await this.repository.findByIdempotency(
      input.organizationId,
      SOURCE_SYSTEM,
      input.externalReference,
      idempotencyKey,
    );
    if (existing) return existing;

    // Emitente derivado do CNPJ da própria organização (nunca do cliente).
    const organization = await this.organizationRepository.findById(
      input.organizationId,
    );
    if (!organization) {
      throw new FiscalApiEmissionError('Organização não encontrada.');
    }
    const company = await this.fiscalApiClient.findCompanyIdByCnpj(
      organization.document,
    );
    if (!company) {
      throw new FiscalApiEmissionError(
        'Emitente fiscal não configurado para o CNPJ da organização. Cadastre o certificado em Configurações → Fiscal.',
      );
    }
    const { id: companyId, defaultEnvironment: environment } = company;

    // Recusa ANTES de qualquer efeito colateral (idempotencyKey/NfseIssuance)
    // — ver nota da classe. A plataforma não sustenta emissão real em
    // PRODUCTION hoje; a fiscal-api recusaria de qualquer forma (424), mas só
    // depois de um round-trip inteiro.
    if (environment === 'PRODUCTION') {
      throw new FiscalApiEmissionError(
        'O Emitente está configurado para PRODUÇÃO, mas esta plataforma ainda só emite em homologação. Ajuste o ambiente em Configurações → Fiscal, ou aguarde a liberação de produção.',
      );
    }

    const service = await this.resolveServiceIssqn.execute({
      organizationId: input.organizationId,
      issqnGroupId: input.issqnGroupId,
    });
    if (!service) {
      throw new FiscalApiEmissionError(
        'Selecione um Grupo de ISSQN válido para emitir a NFS-e.',
      );
    }

    const result = await this.fiscalApiClient.issueNfse({
      companyId,
      sourceSystem: SOURCE_SYSTEM,
      externalReference: input.externalReference,
      idempotencyKey,
      environment,
      customer: input.customer,
      nfse: {
        serviceDescription: input.serviceDescription,
        municipalServiceCode: service.municipalServiceCode,
        nationalServiceCode: service.nationalServiceCode,
        issRate: service.issRate,
        issWithheld: input.issWithheld,
        // Exigibilidade vinda do grupo (não mais fixa em '1' na fiscal-api).
        tribISSQN: service.tribISSQN,
      },
      items: [
        {
          description: input.serviceDescription,
          quantity: 1,
          unitValue: input.totalValue,
          totalValue: input.totalValue,
          serviceCode: service.municipalServiceCode,
        },
      ],
    });

    const issuance = NfseIssuance.create({
      organizationId: input.organizationId,
      companyId,
      sourceSystem: SOURCE_SYSTEM,
      externalReference: input.externalReference,
      idempotencyKey,
      accessKey: result.accessKey,
      protocol: result.protocol,
      status: result.status,
      environment,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      fiscalDocumentId: result.documentId,
    });

    try {
      return await this.repository.save(issuance);
    } catch (error) {
      // Corrida de idempotência: outra requisição da mesma operação gravou
      // primeiro (viola o unique). A fiscal-api já é idempotente (não emite 2×);
      // aqui devolvemos o vínculo existente em vez de estourar 500.
      const raced = await this.repository.findByIdempotency(
        input.organizationId,
        SOURCE_SYSTEM,
        input.externalReference,
        idempotencyKey,
      );
      if (raced) return raced;
      throw error;
    }
  }
}
