import { Injectable } from '@nestjs/common';
import { SaleOrderRepository } from '../../../sales/domain/repositories/sale-order.repository.interface';
import type { SaleOrderPaymentProps } from '../../../sales/domain/entities/sale-order.entity';
import { ProductFiscalRepository } from '../../../catalog/domain/repositories/product-fiscal.repository.interface';
import { ResolveItemIcmsUseCase } from '../../../fiscal-defaults/application/use-cases/resolve-item-icms/resolve-item-icms.use-case';
import { ResolveItemPisCofinsUseCase } from '../../../fiscal-defaults/application/use-cases/resolve-item-pis-cofins/resolve-item-pis-cofins.use-case';
import { ResolveItemIpiUseCase } from '../../../fiscal-defaults/application/use-cases/resolve-item-ipi/resolve-item-ipi.use-case';
import type {
  FiscalApiNfeItem,
  FiscalApiNfeIpi,
  FiscalApiNfePisCofins,
} from '../../domain/providers/fiscal-api-client.interface';
import type { FallbackWarning, PreviewedNfeItem } from '../dtos/issue-nfe.dto';
import { FiscalApiEmissionError } from '../../domain/errors/fiscal-api-emission.error';

/** Plataforma opera single-city Ilhéus/BA (ver CLAUDE.md) — usado como UF de
 * destino padrão quando o cliente não tem endereço com UF cadastrado (venda
 * de balcão/consumidor final sem endereço completo). Não é uma suposição
 * arbitrária: reflete o escopo geográfico atual do produto. */
const DEFAULT_UF = 'BA';

export type ResolveSaleOrderItemsResult = {
  fiscalItems: FiscalApiNfeItem[];
  previewItems: PreviewedNfeItem[];
  warnings: FallbackWarning[];
  totalCents: number;
  /** Pagamentos reais do pedido (spec erp/029) — repassados como estão,
   * quem resolve `PaymentMethod.fiscalCode` é o `IssueNfeUseCase`, não este
   * serviço (que fica só com a resolução fiscal dos itens). */
  payments: SaleOrderPaymentProps[];
};

/**
 * Resolve os itens de um `SaleOrder` para o formato que a fiscal-api espera
 * (spec erp/026, FR-002/FR-005) — chama os 3 resolvedores fiscais já
 * existentes e testados (`ResolveItemIcmsUseCase`/`ResolveItemPisCofinsUseCase`/
 * `ResolveItemIpiUseCase`) por linha, e coleta os `FallbackWarning`s quando um
 * produto não tem grupo fiscal configurado para algum tributo — sem bloquear
 * (decisão do clarify, FR-005). Compartilhado entre a prévia (sem side effect)
 * e a emissão real (`IssueNfeUseCase`), pra não duplicar a lógica de resolução.
 */
@Injectable()
export class ResolveSaleOrderItemsService {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly productFiscalRepository: ProductFiscalRepository,
    private readonly resolveItemIcms: ResolveItemIcmsUseCase,
    private readonly resolveItemPisCofins: ResolveItemPisCofinsUseCase,
    private readonly resolveItemIpi: ResolveItemIpiUseCase,
  ) {}

  async execute(
    organizationId: string,
    saleOrderId: string,
    destinationUf?: string | null,
  ): Promise<ResolveSaleOrderItemsResult> {
    const detail = await this.saleOrderRepository.findById(
      organizationId,
      saleOrderId,
    );
    if (!detail) {
      throw new FiscalApiEmissionError('Pedido de venda não encontrado.');
    }
    if (detail.lines.length === 0) {
      throw new FiscalApiEmissionError(
        'O pedido de venda não tem itens para emitir.',
      );
    }

    // NF-e é documento de mercadoria — linhas de serviço (spec erp/031 D1,
    // `productId: null`) não entram aqui; serviço tem documento fiscal
    // próprio (NFS-e), fora do escopo deste resolvedor.
    const merchandiseLines = detail.lines.filter(
      (line): line is typeof line & { productId: string } =>
        line.productId !== null,
    );
    if (merchandiseLines.length === 0) {
      throw new FiscalApiEmissionError(
        'O pedido de venda só tem itens de serviço — NF-e exige ao menos um item de mercadoria.',
      );
    }

    const uf = (destinationUf ?? DEFAULT_UF).trim().toUpperCase() || DEFAULT_UF;

    const fiscalItems: FiscalApiNfeItem[] = [];
    const previewItems: PreviewedNfeItem[] = [];
    const warnings: FallbackWarning[] = [];
    let totalCents = 0;

    for (const line of merchandiseLines) {
      // `productName`/`productSku` só vêm `null` no join para linha de
      // serviço (spec erp/031 D1) — `merchandiseLines` já as excluiu, então
      // aqui sempre há produto vinculado com nome/SKU reais.
      const productName = line.productName ?? '';
      const productSku = line.productSku ?? '';

      const fiscal = await this.productFiscalRepository.findByProductId(
        organizationId,
        line.productId,
      );
      const quantity = Number(line.quantity);
      const unitValue = line.unitPriceCents / 100;
      const totalValue = line.subtotalCents / 100;
      totalCents += line.subtotalCents;

      const icms = await this.resolveItemIcms.execute({
        organizationId,
        productIcmsGroupId: fiscal?.icmsGroupId ?? null,
        destinationUf: uf,
        emitterUf: DEFAULT_UF,
      });
      const pisCofins = await this.resolveItemPisCofins.execute({
        organizationId,
        productPisCofinsGroupId: fiscal?.pisCofinsGroupId ?? null,
      });
      const ipi = await this.resolveItemIpi.execute({
        organizationId,
        productIpiGroupId: fiscal?.ipiGroupId ?? null,
      });

      const hasFallbackIcms = icms === null;
      const hasFallbackPisCofins = pisCofins === null;
      // IPI ausente não é "fallback zerado" — é o comportamento correto para
      // produto não contribuinte de IPI (ver ResolveItemIpiUseCase). Só conta
      // como aviso de fallback quando o produto TEM parâmetros fiscais mas
      // nenhum grupo de IPI escolhido explicitamente — indistinguível aqui
      // sem um terceiro estado no resolver, então tratamos ausência de grupo
      // configurado como aviso também (mais visível é mais seguro, FR-005).
      const hasFallbackIpi =
        ipi === null && Boolean(fiscal?.ipiGroupId) === false;

      if (hasFallbackIcms) {
        warnings.push({
          productId: line.productId,
          productName,
          tributo: 'ICMS',
        });
      }
      if (hasFallbackPisCofins) {
        warnings.push({
          productId: line.productId,
          productName,
          tributo: 'PIS_COFINS',
        });
      }
      if (hasFallbackIpi) {
        // Achado do typescript-reviewer: este branch faltava — `hasFallbackIpi`
        // era calculado e anexado a `previewItems[]`, mas nunca chegava a
        // `warnings[]`, e a tela só lê `warnings[]` (FR-005 silenciosamente
        // não cumprido pra IPI).
        warnings.push({
          productId: line.productId,
          productName,
          tributo: 'IPI',
        });
      }

      const pis: FiscalApiNfePisCofins | null = pisCofins
        ? { cst: pisCofins.pis.cst, aliquota: pisCofins.pis.aliquota }
        : null;
      const cofins: FiscalApiNfePisCofins | null = pisCofins
        ? { cst: pisCofins.cofins.cst, aliquota: pisCofins.cofins.aliquota }
        : null;
      const ipiInput: FiscalApiNfeIpi | null = ipi
        ? { cst: ipi.cst, cEnq: ipi.cEnq, aliquota: ipi.aliquota }
        : null;

      fiscalItems.push({
        description: productName,
        ncm: fiscal?.ncm ?? '00000000',
        // `cfop` é um `FiscalGroupField` ({value, applyToAll}), não uma string
        // solta — mesmo shape usado pelas outras 4 telas de grupo fiscal.
        cfop: fiscal?.cfop.value ?? '5102',
        quantity,
        unitValue,
        totalValue,
        cst: icms?.cst ?? null,
        csosn: icms?.csosn ?? null,
        icmsAliquota: icms?.aliquota ?? null,
        origem: fiscal?.origin ?? '0',
        pis,
        cofins,
        ipi: ipiInput,
      });

      previewItems.push({
        productId: line.productId,
        productName,
        productSku,
        quantity,
        unitValueCents: line.unitPriceCents,
        totalValueCents: line.subtotalCents,
        hasFallbackIcms,
        hasFallbackPisCofins,
        hasFallbackIpi,
      });
    }

    return {
      fiscalItems,
      previewItems,
      warnings,
      totalCents,
      payments: detail.saleOrder.payments,
    };
  }
}
