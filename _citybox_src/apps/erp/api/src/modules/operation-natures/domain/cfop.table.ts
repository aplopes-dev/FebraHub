/**
 * Tabela de **CFOP** (Código Fiscal de Operações e Prestações) — spec erp/020, FR-004.
 *
 * Estática e versionada em código (mesmo padrão do `cEnq` do IPI e do bundle de CAs
 * da SEFAZ): NÃO é cadastro do lojista nem seed de banco. A atualização entra por PR
 * quando a legislação mudar. O teste de imutabilidade (`cfop.table.spec.ts`) quebra
 * de propósito se alguém alterar o conjunto sem revisão.
 *
 * ⚠️ **Subconjunto curado.** A tabela oficial tem centenas de CFOPs. O caso canônico
 * desta feature é **devolução de mercadoria para fornecedor** (entrada = compra →
 * saída = devolução de compra), então curamos os CFOPs de compra/venda/devolução
 * mais usados, separados por **direção**: `ENTRADA` (`1xxx` interna / `2xxx`
 * interestadual) alimenta o select "De"; `SAIDA` (`5xxx`/`6xxx`) alimenta o "Para".
 * Novos CFOPs entram por PR — o emissor só repassa o código; a curadoria é de produto.
 */
export type CfopDirection = 'ENTRADA' | 'SAIDA';

export type Cfop = {
  code: string;
  description: string;
  direction: CfopDirection;
};

export const CFOPS: readonly Cfop[] = [
  // --- ENTRADA (1xxx interna / 2xxx interestadual) ---
  {
    code: '1101',
    description: 'Compra para industrialização',
    direction: 'ENTRADA',
  },
  {
    code: '1102',
    description: 'Compra para comercialização',
    direction: 'ENTRADA',
  },
  {
    code: '1111',
    description:
      'Compra para industrialização de mercadoria recebida em consignação industrial',
    direction: 'ENTRADA',
  },
  {
    code: '1113',
    description:
      'Compra para comercialização de mercadoria recebida em consignação mercantil',
    direction: 'ENTRADA',
  },
  {
    code: '1201',
    description: 'Devolução de venda de produção do estabelecimento',
    direction: 'ENTRADA',
  },
  {
    code: '1202',
    description:
      'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
    direction: 'ENTRADA',
  },
  {
    code: '2101',
    description: 'Compra para industrialização (interestadual)',
    direction: 'ENTRADA',
  },
  {
    code: '2102',
    description: 'Compra para comercialização (interestadual)',
    direction: 'ENTRADA',
  },
  {
    code: '2201',
    description:
      'Devolução de venda de produção do estabelecimento (interestadual)',
    direction: 'ENTRADA',
  },
  {
    code: '2202',
    description: 'Devolução de venda de mercadoria adquirida (interestadual)',
    direction: 'ENTRADA',
  },
  // --- SAIDA (5xxx interna / 6xxx interestadual) ---
  {
    code: '5101',
    description: 'Venda de produção do estabelecimento',
    direction: 'SAIDA',
  },
  {
    code: '5102',
    description: 'Venda de mercadoria adquirida ou recebida de terceiros',
    direction: 'SAIDA',
  },
  {
    code: '5201',
    description: 'Devolução de compra para industrialização',
    direction: 'SAIDA',
  },
  {
    code: '5202',
    description: 'Devolução de compra para comercialização',
    direction: 'SAIDA',
  },
  {
    code: '5411',
    description:
      'Devolução de compra para comercialização em operação com substituição tributária',
    direction: 'SAIDA',
  },
  {
    code: '6101',
    description: 'Venda de produção do estabelecimento (interestadual)',
    direction: 'SAIDA',
  },
  {
    code: '6102',
    description: 'Venda de mercadoria adquirida (interestadual)',
    direction: 'SAIDA',
  },
  {
    code: '6201',
    description: 'Devolução de compra para industrialização (interestadual)',
    direction: 'SAIDA',
  },
  {
    code: '6202',
    description: 'Devolução de compra para comercialização (interestadual)',
    direction: 'SAIDA',
  },
] as const;

const CFOP_RE = /^\d{4}$/;
const CFOP_BY_CODE = new Map<string, Cfop>(
  CFOPS.map((cfop) => [cfop.code, cfop]),
);

export const ENTRADA_CFOP_CODES: readonly string[] = CFOPS.filter(
  (cfop) => cfop.direction === 'ENTRADA',
).map((cfop) => cfop.code);

export const SAIDA_CFOP_CODES: readonly string[] = CFOPS.filter(
  (cfop) => cfop.direction === 'SAIDA',
).map((cfop) => cfop.code);

export function isValidCfop(code: string | null): boolean {
  if (!code || !CFOP_RE.test(code)) return false;
  return CFOP_BY_CODE.has(code);
}

export function isEntradaCfop(code: string | null): boolean {
  return !!code && CFOP_BY_CODE.get(code)?.direction === 'ENTRADA';
}

export function isSaidaCfop(code: string | null): boolean {
  return !!code && CFOP_BY_CODE.get(code)?.direction === 'SAIDA';
}

/**
 * CSOSN considerados **ICMS livre** (não tributado) — spec erp/020, FR-006. Derivado
 * do grupo de ICMS do item (016 só suporta CST 00 + CSOSN 102/103/300/400):
 * tributado = CST `00` ou CSOSN `102`; **livre** = CSOSN `103` (isenção), `300`
 * (imune), `400` (não tributada). Sem flag manual no produto — a verdade é o CST.
 */
export const ICMS_LIVRE_CSOSN: readonly string[] = ['103', '300', '400'];

export function isIcmsLivre(
  icmsCst: string | null,
  icmsCsosn: string | null,
): boolean {
  // Regime Normal: só CST 00 suportado (tributado) → não é livre.
  if (icmsCst !== null) return false;
  // Simples: livre se o CSOSN está no conjunto não-tributado.
  return icmsCsosn !== null && ICMS_LIVRE_CSOSN.includes(icmsCsosn);
}
