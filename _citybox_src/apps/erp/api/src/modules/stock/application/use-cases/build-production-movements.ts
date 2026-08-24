import { StockMovement } from '../../domain/entities/stock-movement.entity';
import type { BomComponent } from '../../domain/repositories/production-bom.lookup.interface';
import type { ComputedInsumo } from '../dtos/production-order.dto';
import { multiplyDecimal } from './multiply-decimal';

export type BuildProductionMovementsInput = {
  organizationId: string;
  orderId: string;
  productId: string;
  /** Quantidade produzida — Decimal string. */
  producedQuantity: string;
  sourceStockId: string;
  destinationStockId: string;
  components: BomComponent[];
  operatedAt: Date;
  createdByUserId: string;
};

export type BuildProductionMovementsResult = {
  /** `null` quando o produto não tem componentes na ficha técnica. */
  outbound: StockMovement | null;
  inbound: StockMovement;
};

/**
 * Monta os movimentos da finalização de uma ordem de produção:
 * - saída dos insumos, se a ficha tiver componentes;
 * - entrada do produto acabado, sempre.
 *
 * Custo da entrada = custo total dos insumos consumidos ÷ quantidade
 * produzida (custo médio da unidade produzida). Sem componentes, o custo da
 * entrada é `0` — não há como derivar custo sem BOM nesta fase.
 */
export function buildProductionMovements(
  input: BuildProductionMovementsInput,
): BuildProductionMovementsResult {
  let outbound: StockMovement | null = null;
  let inboundCostCents = 0;

  if (input.components.length > 0) {
    let totalComponentsCostCents = 0;
    const lines = input.components.map((component) => {
      const quantity = multiplyDecimal(
        component.quantityPerUnit,
        input.producedQuantity,
      );
      totalComponentsCostCents += Math.round(
        Number(quantity) * component.unitCostCents,
      );
      return {
        productId: component.componentProductId,
        quantity,
        costCents: component.unitCostCents,
      };
    });

    outbound = StockMovement.create({
      organizationId: input.organizationId,
      stockId: input.sourceStockId,
      type: 'saida',
      operatedAt: input.operatedAt,
      createdByUserId: input.createdByUserId,
      sourceType: 'production',
      sourceId: input.orderId,
      lines,
    });

    const producedQuantityNumber = Number(input.producedQuantity);
    inboundCostCents =
      producedQuantityNumber > 0
        ? Math.round(totalComponentsCostCents / producedQuantityNumber)
        : 0;
  }

  const inbound = StockMovement.create({
    organizationId: input.organizationId,
    stockId: input.destinationStockId,
    type: 'entrada',
    operatedAt: input.operatedAt,
    createdByUserId: input.createdByUserId,
    sourceType: 'production',
    sourceId: input.orderId,
    lines: [
      {
        productId: input.productId,
        quantity: input.producedQuantity,
        costCents: inboundCostCents,
      },
    ],
  });

  return { outbound, inbound };
}

/**
 * Calcula os insumos (BOM × quantidade) para exibição — usado tanto na
 * finalização (custo real) quanto no detalhe da ordem (prévia).
 */
export function computeInsumos(
  components: BomComponent[],
  quantity: string,
): ComputedInsumo[] {
  return components.map((component) => {
    const totalQuantity = multiplyDecimal(component.quantityPerUnit, quantity);
    const totalCostCents = Math.round(
      Number(totalQuantity) * component.unitCostCents,
    );
    return {
      componentProductId: component.componentProductId,
      name: component.name,
      unit: component.unit,
      quantityPerUnit: component.quantityPerUnit,
      totalQuantity,
      unitCostCents: component.unitCostCents,
      totalCostCents,
    };
  });
}
