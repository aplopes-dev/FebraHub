import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import { PaymentMethodRepository } from '../../../../finance/payment-methods/domain/repositories/payment-method.repository.interface';
import type { SaleOrderPaymentProps } from '../../../../sales/domain/entities/sale-order.entity';
import { NfeIssuance } from '../../../domain/entities/nfe-issuance.entity';
import { NfeIssuanceRepository } from '../../../domain/repositories/nfe-issuance.repository.interface';
import {
  FiscalApiClient,
  type FiscalApiNfePayment,
} from '../../../domain/providers/fiscal-api-client.interface';
import { FiscalApiEmissionError } from '../../../domain/errors/fiscal-api-emission.error';
import { ResolveSaleOrderItemsService } from '../../services/resolve-sale-order-items';
import type { IssueNfeInput } from '../../dtos/issue-nfe.dto';

const SOURCE_SYSTEM = 'erp';
const DEFAULT_OPERATION_NATURE = 'Venda de mercadoria';
/** `tPag` "Outros" — usado só quando o lojista configurou esse código de
 * propósito para uma forma real (nunca mais um fallback silencioso, spec
 * erp/029). Exige `xPag` (`description`), preenchido com o nome da forma. */
const OUTROS_PAYMENT_CODE = '99';

/**
 * Emite uma NF-e a partir de um pedido de venda (spec erp/026). Resolve
 * ICMS/PIS-COFINS/IPI por linha (`ResolveSaleOrderItemsService` — os 3
 * resolvedores já existiam, só não eram chamados por nenhum caso de uso
 * real), monta o `IssueNfeRequest` e transmite. **Idempotente por
 * `saleOrderId`**: FR-006/SC-004 — no máximo uma NF-e emitida com sucesso por
 * pedido (o índice único no banco é a garantia final; esta checagem evita o
 * round-trip desnecessário no caminho feliz).
 *
 * Mesma guarda de PRODUCTION da spec 025 (`nfse-issuance`) — a plataforma só
 * sustenta emissão real em HOMOLOGATION hoje; recusa ANTES de qualquer efeito
 * colateral (resolução de itens, chamada à fiscal-api, persistência).
 */
@Injectable()
export class IssueNfeUseCase implements IUseCase<IssueNfeInput, NfeIssuance> {
  constructor(
    private readonly repository: NfeIssuanceRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly fiscalApiClient: FiscalApiClient,
    private readonly resolveSaleOrderItems: ResolveSaleOrderItemsService,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: IssueNfeInput): Promise<NfeIssuance> {
    // FR-006/SC-004 — checagem no caminho feliz; o índice único do banco
    // cobre a corrida (ver catch abaixo).
    const existing = await this.repository.findBySaleOrderId(
      input.organizationId,
      input.saleOrderId,
    );
    if (existing) return existing;

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

    if (environment === 'PRODUCTION') {
      throw new FiscalApiEmissionError(
        'O Emitente está configurado para PRODUÇÃO, mas esta plataforma ainda só emite em homologação. Ajuste o ambiente em Configurações → Fiscal, ou aguarde a liberação de produção.',
      );
    }

    const { fiscalItems, payments } = await this.resolveSaleOrderItems.execute(
      input.organizationId,
      input.saleOrderId,
      input.customer.address?.uf,
    );

    // spec erp/029 (B1/FR-001-003): tPag real por pagamento do pedido, nunca
    // mais um 99 fixo sem xPag (era a causa da rejeição SEFAZ 441 — o
    // fallback nem chegava a ser um código válido do jeito que era enviado).
    const fiscalPayments = await this.resolvePayments(
      input.organizationId,
      payments,
    );

    const result = await this.fiscalApiClient.issueNfe({
      companyId,
      sourceSystem: SOURCE_SYSTEM,
      externalReference: input.saleOrderId,
      idempotencyKey: input.saleOrderId,
      environment,
      operationNature: DEFAULT_OPERATION_NATURE,
      operationType: '1',
      destinationIndicator: '1',
      finalConsumer: true,
      presenceIndicator: '1',
      // Mantido por compatibilidade com o DTO da fiscal-api (ver comentário
      // em `IssueNfeRequest`) — a fiscal-api usa `payments` com precedência
      // quando ambos vêm.
      paymentMethodCode: fiscalPayments[0].method,
      payments: fiscalPayments,
      customer: input.customer,
      items: fiscalItems,
    });

    const issuance = NfeIssuance.create({
      organizationId: input.organizationId,
      saleOrderId: input.saleOrderId,
      companyId,
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
      // Corrida: outra requisição para o mesmo pedido gravou primeiro (viola
      // o unique de `saleOrderId`). A fiscal-api já é idempotente por
      // `idempotencyKey`; aqui devolvemos o vínculo existente em vez de
      // estourar 500 — mesmo padrão de `nfse-issuance`.
      const raced = await this.repository.findBySaleOrderId(
        input.organizationId,
        input.saleOrderId,
      );
      if (raced) return raced;
      throw error;
    }
  }

  /**
   * Resolve `PaymentMethod.fiscalCode` para cada pagamento do pedido — um
   * `detPag` por pagamento (FR-002, nunca consolidado, pra não perder
   * informação fiscal). Bloqueia ANTES de transmitir (FR-003, decisão do
   * clarify) quando alguma forma usada não tem `fiscalCode` configurado, em
   * vez de cair silenciosamente num código inválido (era exatamente esse
   * fallback que causava a rejeição 441 original).
   */
  private async resolvePayments(
    organizationId: string,
    payments: readonly SaleOrderPaymentProps[],
  ): Promise<FiscalApiNfePayment[]> {
    if (payments.length === 0) {
      throw new FiscalApiEmissionError(
        'O pedido de venda não tem pagamento registrado — não é possível emitir a NF-e sem meio de pagamento.',
      );
    }

    const uniqueMethodIds = [...new Set(payments.map((p) => p.methodId))];
    const methods = await this.paymentMethodRepository.findByIds(
      organizationId,
      uniqueMethodIds,
    );
    const methodById = new Map(methods.map((method) => [method.id, method]));

    return payments.map((payment) => {
      const method = methodById.get(payment.methodId);
      // spec erp/030, FR-009 — distingue as duas causas de bloqueio. Antes
      // as duas caíam na mesma mensagem ("forma... não tem o código fiscal
      // configurado"), que induzia ao erro quando a causa real era um
      // `methodId` órfão (ex.: id de catálogo mock sem correspondência —
      // ver migration `backfill_sale_order_payment_method_ids`): mandava o
      // lojista configurar algo que já estava correto.
      if (!method) {
        throw new FiscalApiEmissionError(
          'A forma de pagamento do pedido não está mais cadastrada. Edite o pedido e selecione uma forma de pagamento válida.',
        );
      }
      if (!method.fiscalCode) {
        throw new FiscalApiEmissionError(
          `A forma de pagamento "${method.name}" não tem o código fiscal (tPag) configurado. Configure em Configurações → Formas de pagamento antes de emitir a NF-e.`,
        );
      }
      return {
        method: method.fiscalCode,
        amount: payment.amountCents / 100,
        // xPag — obrigatório pela SEFAZ quando tPag=99, e só nesse caso: um
        // lojista pode configurar "Outros" de propósito para uma forma real
        // (ex.: vale-compra), não é mais o fallback silencioso de antes.
        description:
          method.fiscalCode === OUTROS_PAYMENT_CODE ? method.name : undefined,
      };
    });
  }
}
