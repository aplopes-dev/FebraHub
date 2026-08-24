import type { NfeItemDto } from '../../domain/validators/nfe-item.zod.validator';
import type { NfeItemInput } from '../../infrastructure/xml/nfe-xml.builder';

/**
 * Traduz o item validado (`NfeItemDto`, camada de domínio, `cst`/`csosn`
 * soltos como `string`) para o shape que o builder XML exige (`NfeItemInput`,
 * `cst` de PIS/COFINS/IPI como union literal — spec erp/026, FR-002/FR-003).
 *
 * A narrowing (`as`) é segura aqui porque **`validateNfeItem`/`validateNfeItems`
 * já rodou antes** em todo caller (`issue-nfe.use-case.ts`, `issue-nfce.use-case.ts`)
 * — o zod já rejeitou qualquer CST fora do conjunto suportado (`PIS_COFINS_CST_SUPPORTED`/
 * `IPI_CST_SUPPORTED`), então neste ponto o valor já está garantido dentro do
 * union. Chamar esta função sem validar antes é um bug de uso, não coberto por
 * este mapper (ele só traduz o shape, não revalida).
 */
export function toNfeItemInput(item: NfeItemDto): NfeItemInput {
  return {
    description: item.description,
    ncm: item.ncm,
    cfop: item.cfop,
    quantity: item.quantity,
    unitValue: item.unitValue,
    totalValue: item.totalValue,
    cst: item.cst ?? null,
    csosn: item.csosn ?? null,
    icmsAliquota: item.icmsAliquota ?? null,
    origem: item.origem ?? null,
    pis: item.pis
      ? {
          cst: item.pis.cst as NonNullable<NfeItemInput['pis']>['cst'],
          aliquota: item.pis.aliquota ?? undefined,
        }
      : null,
    cofins: item.cofins
      ? {
          cst: item.cofins.cst as NonNullable<NfeItemInput['cofins']>['cst'],
          aliquota: item.cofins.aliquota ?? undefined,
        }
      : null,
    ipi: item.ipi
      ? {
          cst: item.ipi.cst as NonNullable<NfeItemInput['ipi']>['cst'],
          cEnq: item.ipi.cEnq,
          aliquota: item.ipi.aliquota ?? undefined,
        }
      : null,
  };
}
