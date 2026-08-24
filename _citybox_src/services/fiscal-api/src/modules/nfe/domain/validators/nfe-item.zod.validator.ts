import { z } from 'zod';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

/// Tolerância de centavo para conferir totalValue = quantity * unitValue —
/// evita falso-negativo por arredondamento de ponto flutuante.
const ROUNDING_TOLERANCE = 0.01;

/// Mesmo conjunto que `nfe-xml.builder.ts` (`PisCofinsCst`) — tipado como
/// `string` solto aqui (mesma convenção do `cst`/`csosn` de nível superior
/// neste arquivo, que também não usam union literal) para não acoplar o DTO
/// de domínio ao union type da camada de infraestrutura (XML); a restrição
/// real de valores é o `Set` abaixo, verificado em runtime pelo zod (FR-004).
const PIS_COFINS_CST_SUPPORTED = new Set([
  '01',
  '02',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
]);

/// Mesmo conjunto de `IpiCst` (saída) do builder — ver nota acima.
const IPI_CST_SUPPORTED = new Set(['50', '51', '52', '53', '54', '55', '99']);

/// Tabela oficial de CST de ICMS (Regime Normal) e CSOSN (Simples Nacional) —
/// achado do security-reviewer (spec erp/026): `cst`/`csosn` iam direto pro
/// XML (`ICMSSN${item.csosn}`/`CST: item.cst`) sem nenhuma restrição de
/// valores, ao contrário de PIS/COFINS/IPI (FR-004 ficava incompleta pro
/// tributo de maior peso fiscal na nota). Lista completa da tabela SEFAZ, mais
/// ampla que o subconjunto que o cadastro de Grupo de ICMS da erp-api oferece
/// hoje (`ICMS_CST_SUPPORTED`/`ICMS_CSOSN_SUPPORTED` em
/// `fiscal-defaults/domain/entities/fiscal-group.entity.ts` — só '00' e
/// 102/103/300/400) — a fiscal-api é a camada mais baixa e não deve ficar mais
/// restritiva que o padrão oficial, mesmo que hoje só um caller exista.
const ICMS_CST_SUPPORTED = new Set([
  '00',
  '10',
  '20',
  '30',
  '40',
  '41',
  '50',
  '51',
  '60',
  '70',
  '90',
]);
const ICMS_CSOSN_SUPPORTED = new Set([
  '101',
  '102',
  '103',
  '201',
  '202',
  '203',
  '300',
  '400',
  '500',
  '900',
]);

const MAX_ALIQUOTA = 100;

export type NfeItemPisCofinsDto = {
  cst: string;
  aliquota?: number | null;
};

export type NfeItemIpiDto = {
  cst: string;
  cEnq: string;
  aliquota?: number | null;
};

export type NfeItemDto = {
  description: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  cst?: string | null;
  csosn?: string | null;
  /// ICMS resolvido pelo emissor (spec erp/026) — alíquota da UF de destino em
  /// %. Vale só para o Regime Normal (`ICMS00`); no Simples é ignorada.
  icmsAliquota?: number | null;
  /// Origem da mercadoria (`orig`, 0–8). Ausente → builder assume '0' (nacional).
  origem?: string | null;
  /// PIS/COFINS resolvidos (spec erp/026, FR-002/FR-003). Ausente → builder
  /// aplica o fallback zerado já existente (CST 49, não-regressão).
  pis?: NfeItemPisCofinsDto | null;
  cofins?: NfeItemPisCofinsDto | null;
  /// IPI resolvido (spec erp/026). Ausente → nenhum bloco IPI no XML
  /// (não-regressão FR-008 da spec erp/019).
  ipi?: NfeItemIpiDto | null;
};

const pisCofinsSchema = z
  .object({
    cst: z.string().refine((cst) => PIS_COFINS_CST_SUPPORTED.has(cst), {
      message: 'CST de PIS/COFINS fora do conjunto suportado',
    }),
    aliquota: z
      .number()
      .min(0, 'alíquota não pode ser negativa')
      .max(MAX_ALIQUOTA, 'alíquota não pode ser maior que 100')
      .nullish(),
  })
  .nullish();

const ipiSchema = z
  .object({
    cst: z.string().refine((cst) => IPI_CST_SUPPORTED.has(cst), {
      message: 'CST de IPI fora do conjunto suportado (saída)',
    }),
    cEnq: z
      .string()
      .min(1, 'Código de Enquadramento Legal do IPI é obrigatório'),
    aliquota: z
      .number()
      .min(0, 'alíquota não pode ser negativa')
      .max(MAX_ALIQUOTA, 'alíquota não pode ser maior que 100')
      .nullish(),
  })
  .nullish();

const itemSchema = z
  .object({
    description: z.string().min(1, 'descrição do item é obrigatória'),
    ncm: z.string().regex(/^\d{8}$/, 'NCM deve ter 8 dígitos'),
    cfop: z.string().regex(/^\d{4}$/, 'CFOP deve ter 4 dígitos'),
    quantity: z.number().positive('quantidade deve ser maior que zero'),
    unitValue: z.number().min(0, 'valor unitário não pode ser negativo'),
    totalValue: z.number().min(0, 'valor total não pode ser negativo'),
    cst: z
      .string()
      .refine((cst) => ICMS_CST_SUPPORTED.has(cst), {
        message: 'CST de ICMS fora do conjunto suportado',
      })
      .nullish(),
    csosn: z
      .string()
      .refine((csosn) => ICMS_CSOSN_SUPPORTED.has(csosn), {
        message: 'CSOSN fora do conjunto suportado',
      })
      .nullish(),
    icmsAliquota: z
      .number()
      .min(0, 'alíquota de ICMS não pode ser negativa')
      .max(MAX_ALIQUOTA, 'alíquota de ICMS não pode ser maior que 100')
      .nullish(),
    origem: z
      .string()
      .regex(/^[0-8]$/, 'origem deve ser um dígito de 0 a 8')
      .nullish(),
    pis: pisCofinsSchema,
    cofins: pisCofinsSchema,
    ipi: ipiSchema,
  })
  // `buildImpostoXml` decide o bloco ICMS por `item.csosn` truthy — se os dois
  // vierem preenchidos, `cst` seria descartado em silêncio (o builder nunca
  // avisa). Rejeitar aqui em vez de deixar o caller mandar um item
  // fiscalmente ambíguo (Regime Normal E Simples ao mesmo tempo).
  .refine((item) => !(item.cst && item.csosn), {
    message: 'Um item não pode ter CST e CSOSN preenchidos ao mesmo tempo',
    path: ['csosn'],
  });

/// Valida a completude de um item de NF-e (US1 Acceptance Scenario 2,
/// SC-004) — rejeitado ANTES de qualquer reserva de numeração ou tentativa de
/// transmissão à SEFAZ. **FR-004 (spec erp/026)**: CST/alíquota de PIS, COFINS
/// e IPI (quando presentes) são revalidados aqui — a fiscal-api não confia
/// cegamente no que o caller (erp-api) mandou, mesmo padrão de defesa em
/// profundidade das demais rotas fiscais.
export function validateNfeItem(item: NfeItemDto, context: string): void {
  const parsed = itemSchema.safeParse(item);
  if (!parsed.success) {
    const msg = ZodUtils.formatZodError(parsed.error);
    throw new ValidatorDomainError({
      internalMessage: `Invalid NF-e item: ${msg}`,
      externalMessage: msg,
      context,
    });
  }

  const expectedTotal = item.quantity * item.unitValue;
  if (Math.abs(expectedTotal - item.totalValue) > ROUNDING_TOLERANCE) {
    throw new ValidatorDomainError({
      internalMessage: `Item totalValue (${item.totalValue}) does not match quantity * unitValue (${expectedTotal})`,
      externalMessage: `Valor total do item não confere com quantidade × valor unitário`,
      context,
    });
  }
}

export function validateNfeItems(items: NfeItemDto[], context: string): void {
  if (items.length === 0) {
    throw new ValidatorDomainError({
      internalMessage: 'NF-e must have at least one item',
      externalMessage: 'A nota fiscal deve ter ao menos um item',
      context,
    });
  }
  items.forEach((item) => validateNfeItem(item, context));
}
