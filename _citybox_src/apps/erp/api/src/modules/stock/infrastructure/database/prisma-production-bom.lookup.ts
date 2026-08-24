import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductionBomLookup,
  type ProductionBomResult,
} from '../../domain/repositories/production-bom.lookup.interface';

/**
 * Lê a ficha técnica "ao vivo" — a ordem de produção nunca copia a receita, o
 * cálculo de insumos sempre reflete a `TechnicalSheet` atual do produto.
 */
@Injectable()
export class PrismaProductionBomLookup extends ProductionBomLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Custo unitário da **última compra recebida** de cada insumo, em centavos.
   *
   * `Product` não tem campo de custo — só `basePriceCents`, que é preço de
   * venda. O custo real já está gravado em `PurchaseLine.costCents` a cada
   * entrada; aqui ele é consolidado por produto.
   *
   * Uma query só para todos os insumos (não N+1). A redução do "mais recente
   * por produto" é feita em memória em vez de `DISTINCT ON` porque o volume é
   * limitado pelo nº de compras por insumo — dezenas, num catálogo de
   * pequeno/médio porte — e mantém a query legível. Se virar gargalo, o
   * caminho é materializar o custo no produto (custo médio), que é a evolução
   * natural desta decisão.
   */
  private async findLastPurchaseCosts(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, number>> {
    const byProduct = new Map<string, number>();
    if (productIds.length === 0) return byProduct;

    const lines = await this.prisma.scoped.purchaseLine.findMany({
      where: {
        organizationId,
        productId: { in: productIds },
        status: 'received',
        purchase: { deletedAt: null },
      },
      select: {
        productId: true,
        costCents: true,
        purchase: { select: { purchasedAt: true } },
      },
      orderBy: { purchase: { purchasedAt: 'desc' } },
    });

    for (const line of lines) {
      // Ordenado desc: a primeira ocorrência de cada produto é a mais recente.
      if (!byProduct.has(line.productId)) {
        byProduct.set(line.productId, line.costCents);
      }
    }

    return byProduct;
  }

  async findBom(
    organizationId: string,
    productId: string,
  ): Promise<ProductionBomResult | null> {
    const product = await this.prisma.scoped.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
      select: { name: true, sku: true, type: true, trackStock: true },
    });
    if (!product || product.type === 'supply') return null;

    // Movimentação, transferência, inventário e compra já barram produto sem
    // controle de estoque (`ProductNotTrackableError`). A produção não barrava:
    // finalizar gravava linha em `stock_balances` para um produto que o
    // balanço filtra (`trackStock: true`), então o saldo existia no banco e era
    // INVISÍVEL na tela — e ainda travava a exclusão do depósito, que enxerga
    // esse saldo via `hasMovementsOrBalance`.
    if (!product.trackStock) {
      return {
        eligible: false,
        reason:
          'Produto não controla estoque — habilite o controle na ficha do produto para usá-lo em ordens de produção.',
      };
    }

    const sheet = await this.prisma.scoped.technicalSheet.findFirst({
      where: { productId, organizationId },
      include: {
        components: {
          include: {
            component: {
              select: {
                name: true,
                basePriceCents: true,
                trackStock: true,
                deletedAt: true,
                unitOfMeasure: { select: { abbreviation: true } },
              },
            },
          },
        },
      },
    });

    if (!sheet) {
      return {
        eligible: false,
        reason: 'Produto sem ficha técnica cadastrada.',
      };
    }
    if (sheet.productionType !== 'productive_process') {
      return {
        eligible: false,
        reason:
          'Ficha técnica do produto não é de produção por ordem (processo produtivo).',
      };
    }

    // `optional` existe no schema e era ignorado: uma "cobertura de chocolate
    // (opcional)" dava baixa em TODA ordem finalizada, tenha sido usada ou não.
    const required = sheet.components.filter(
      (component) => !component.optional,
    );

    const unusable = required.find(
      (component) =>
        component.component.deletedAt !== null ||
        !component.component.trackStock,
    );
    if (unusable) {
      return {
        eligible: false,
        reason: `O insumo "${unusable.component.name}" foi excluído ou não controla estoque. Ajuste a ficha técnica antes de produzir.`,
      };
    }

    const lastCostByProduct = await this.findLastPurchaseCosts(
      organizationId,
      required.map((component) => component.componentProductId),
    );

    return {
      eligible: true,
      productName: product.name,
      productSku: product.sku,
      components: required.map((component) => ({
        componentProductId: component.componentProductId,
        name: component.component.name,
        unit: component.component.unitOfMeasure?.abbreviation ?? 'un',
        quantityPerUnit: component.quantity.toString(),
        // Custo real da última entrada, NÃO `basePriceCents` (que é preço de
        // VENDA): um insumo que custa R$ 2,00 e vende a R$ 6,00 era lançado no
        // ledger a R$ 6,00, e o acabado saía com custo 3× inflado — CMV e
        // margem invertidos, com o número aparecendo na tela rotulado como
        // custo. Sem compra recebida ainda, cai em 0: melhor não valorar do que
        // valorar pelo preço de venda.
        unitCostCents: lastCostByProduct.get(component.componentProductId) ?? 0,
      })),
    };
  }
}
