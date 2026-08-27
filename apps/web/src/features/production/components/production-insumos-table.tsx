"use client";

import {
  formatCurrencyCents,
  formatQuantity,
  sumInsumosCostCents,
} from "@/features/production/lib/production-calc";
import type { ComputedInsumo } from "@/features/production/types/production";

type ProductionInsumosTableProps = {
  insumos: ComputedInsumo[];
  /** Mostra a coluna/linha de custo (usado na finalização). */
  showCost?: boolean;
  /** Mensagem exibida enquanto o detalhe (com os insumos) ainda está carregando. */
  loading?: boolean;
};

export function ProductionInsumosTable({
  insumos,
  showCost = false,
  loading = false,
}: ProductionInsumosTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
        Carregando insumos…
      </div>
    );
  }

  if (insumos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
        Este produto ainda não tem ficha técnica (insumos) cadastrada.
      </div>
    );
  }

  const totalCostCents = sumInsumosCostCents(insumos);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Insumo</th>
            <th className="px-3 py-2 text-right font-medium">Por unidade</th>
            <th className="px-3 py-2 text-right font-medium">Necessário</th>
            {showCost ? (
              <>
                <th className="px-3 py-2 text-right font-medium">Custo unit.</th>
                <th className="px-3 py-2 text-right font-medium">Custo total</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {insumos.map((insumo) => (
            <tr
              key={insumo.componentProductId}
              className="border-b border-border/40 last:border-b-0"
            >
              <td className="px-3 py-2.5 font-medium text-foreground">
                {insumo.name}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                {formatQuantity(insumo.quantityPerUnit)} {insumo.unit}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-semibold text-foreground">
                {formatQuantity(insumo.totalQuantity)} {insumo.unit}
              </td>
              {showCost ? (
                <>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                    {formatCurrencyCents(insumo.unitCostCents)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap text-foreground">
                    {formatCurrencyCents(insumo.totalCostCents)}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
        {showCost ? (
          <tfoot>
            <tr className="border-t border-border/60 bg-muted/20">
              <td
                className="px-3 py-2.5 text-right font-medium text-muted-foreground"
                colSpan={4}
              >
                Custo total da produção
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-bold text-foreground">
                {formatCurrencyCents(totalCostCents)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
