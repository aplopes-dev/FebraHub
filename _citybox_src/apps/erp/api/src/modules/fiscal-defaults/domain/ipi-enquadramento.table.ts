/**
 * Tabela de **Código de Enquadramento Legal do IPI** (`cEnq`) — spec erp/019, FR-009.
 *
 * Estática e versionada em código (mesmo padrão do bundle de CAs da SEFAZ): NÃO é
 * cadastro do lojista nem seed de banco. A atualização entra por PR quando a Nota
 * Técnica da RFB mudar. O teste de imutabilidade
 * (`ipi-enquadramento.table.spec.ts`) quebra de propósito se alguém alterar o
 * conjunto sem passar por revisão.
 *
 * ⚠️ **Subconjunto curado.** A tabela oficial (Ato COTEPE/ICMS, Anexo do RIPI) tem
 * ~100 entradas. O piloto (comércio/food em Ilhéus) raramente é contribuinte de
 * IPI, então oferecemos os enquadramentos mais usados + `999` (tributação normal,
 * o caso de quem não tem enquadramento específico). Novos códigos entram por PR —
 * o emissor apenas repassa o `cEnq` (1–3 dígitos aceitos pelo XSD), a curadoria é
 * de produto, não técnica.
 *
 * O `cst` associado é orientativo (qual CST de IPI normalmente usa o código); a
 * validação de coerência CST↔cEnq fica para evolução — o v1 valida só o formato e
 * a pertença ao conjunto.
 */
export type IpiEnquadramento = {
  code: string;
  description: string;
  /** CST de IPI ao qual o enquadramento normalmente se aplica (orientativo). */
  cst: string;
};

export const IPI_ENQUADRAMENTOS: readonly IpiEnquadramento[] = [
  {
    code: '999',
    description: 'Tributação normal do IPI',
    cst: '50',
  },
  {
    code: '101',
    description: 'Imunidade — livros, jornais e periódicos (RIPI art. 18, I)',
    cst: '54',
  },
  {
    code: '102',
    description:
      'Imunidade — produtos destinados à exportação (RIPI art. 18, II)',
    cst: '54',
  },
  {
    code: '103',
    description: 'Imunidade — ouro ativo financeiro (RIPI art. 18, III)',
    cst: '54',
  },
  {
    code: '104',
    description:
      'Imunidade — energia elétrica, derivados de petróleo, combustíveis e minerais (RIPI art. 18, IV)',
    cst: '54',
  },
  {
    code: '201',
    description:
      'Isenção — produtos industrializados por instituições de educação/assistência (RIPI art. 54)',
    cst: '52',
  },
  {
    code: '301',
    description:
      'Suspensão — remessa para industrialização por encomenda (RIPI art. 43, VI)',
    cst: '55',
  },
  // Nota: CST 51 (saída tributada com alíquota zero) usa o mesmo `999`
  // (tributação normal) — não há enquadramento próprio. Não duplicar a entrada
  // `999` aqui: `IPI_ENQUADRAMENTO_CODES` dedup por Set, mas a tabela é dado de
  // referência e um `code` repetido corromperia qualquer lookup por código.
] as const;

/** Conjunto de códigos válidos (dedup). Fonte de verdade para o select da erp-web. */
export const IPI_ENQUADRAMENTO_CODES: readonly string[] = Array.from(
  new Set(IPI_ENQUADRAMENTOS.map((entry) => entry.code)),
);

/** `cEnq` deve ter 1–3 dígitos (restrição do XSD TIpi). */
const IPI_ENQUADRAMENTO_RE = /^\d{1,3}$/;

export function isValidIpiEnquadramento(code: string | null): boolean {
  if (!code || !IPI_ENQUADRAMENTO_RE.test(code)) return false;
  return IPI_ENQUADRAMENTO_CODES.includes(code);
}
