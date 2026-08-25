import { create } from 'xmlbuilder2';
import type { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import { buildNfeAccessKey } from './access-key';

/**
 * Construtor do XML da NF-e/NFC-e (layout 4.00). Portado de @citybox/fiscal-api
 * (nfe-xml.builder.ts). Mantém o caminho do modelo 65 (NFC-e) completo:
 * ide/mod=65, tpImp, máscara de homologação em xProd, detPag de pagamentos,
 * grupos ICMS/PIS/COFINS/IPI. Toda a lógica tributária e a ordem dos campos são
 * preservadas exatamente — divergências causam rejeições silenciosas do fisco.
 */

type XmlDocumentInput = Record<string, unknown>;

/** Wrapper fino sobre xmlbuilder2 — produz o XML final em UTF-8. */
function buildXml(
  input: XmlDocumentInput,
  options?: { prettyPrint?: boolean; docOptions?: XMLBuilderCreateOptions },
): Buffer {
  const doc = create(
    { version: '1.0', encoding: 'UTF-8', ...options?.docOptions },
    input,
  );
  const xml = doc.end({ prettyPrint: options?.prettyPrint ?? false });
  return Buffer.from(xml, 'utf-8');
}

export type NfeAddress = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  cityCodeIbge: string;
  cityName: string;
  uf: string;
  zipCode: string;
};

export type NfeEmitter = {
  cnpj: string;
  legalName: string;
  stateRegistration: string;
  /**
   * CRT — Código de Regime Tributário: derivado de Company.taxRegime
   * (1 = Simples Nacional, 3 = Regime Normal). CRT 2 (Simples Nacional
   * excesso de sublimite) fora de escopo do v1.
   */
  taxRegimeCode: '1' | '3';
  address: NfeAddress;
};

export type NfeRecipient = {
  document: string;
  documentType: 'CPF' | 'CNPJ';
  name: string;
  address?: NfeAddress | null;
};

/**
 * PIS/COFINS já resolvidos por item. Quem monta o pedido de emissão (erp/PDV)
 * resolve produto → grupo → CST + alíquota e envia pronto; a fiscal não conhece
 * grupos fiscais.
 *
 * - CST `01`/`02` = tributado (`PISAliq`/`COFINSAliq`): exige `aliquota` (%).
 * - CST `04`..`09` = não tributado (`PISNT`/`COFINSNT`): sem `aliquota`.
 *
 * Ausência → fallback CST 01 zerado (produto sem grupo/sem padrão).
 *
 * União literal (não `string`) para não tratar silenciosamente um CST inválido
 * (03/49/typo) como NT.
 */
export type PisCofinsCst =
  | '01'
  | '02'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09';

export type NfePisCofinsInput = {
  cst: PisCofinsCst;
  aliquota?: number;
};

/**
 * CST de IPI **de saída** suportado. O v1 só emite saída (`tpNF: '1'`), então
 * entradas (00–05, 49) ficam de fora. Tributado (50, 99) vira `IPITrib` (com
 * `vBC`/`pIPI`/`vIPI`); 51–55 vira `IPINT` (sem valores).
 */
export type IpiCst = '50' | '51' | '52' | '53' | '54' | '55' | '99';

/**
 * IPI resolvido por item. Quem monta o pedido resolve produto → grupo → CST +
 * `cEnq` + alíquota e envia pronto; a fiscal não conhece grupos fiscais.
 *
 * - `cst` 50/99 = tributado (`IPITrib`): exige `aliquota` (% ex.: 10).
 * - `cst` 51–55 = não tributado (`IPINT`): sem `aliquota`, sem valores.
 * - `cEnq` = Código de Enquadramento Legal do IPI (1–3 dígitos, tabela estática).
 *
 * **Ausência do campo `ipi` no item → nenhum bloco `IPI` é emitido** (produto
 * que não é contribuinte de IPI).
 */
export type NfeIpiInput = {
  cst: IpiCst;
  cEnq: string;
  aliquota?: number;
};

export type NfeItemInput = {
  description: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  /**
   * Um dos dois deve vir preenchido, conforme o regime tributário do Emitente
   * (CST para Regime Normal, CSOSN para Simples Nacional).
   */
  cst?: string | null;
  csosn?: string | null;
  /**
   * ICMS resolvido pelo emissor. Regime Normal (`ICMS00`): alíquota da UF de
   * destino em % (ex.: 18) — a base é `totalValue`. Ausente → 0.00 (fallback).
   * No Simples (`ICMSSN{csosn}`) é ignorado (o grupo não carrega alíquota).
   */
  icmsAliquota?: number | null;
  /** Origem da mercadoria (`orig`, 0–8). Ausente → '0' (nacional). */
  origem?: string | null;
  /** PIS/COFINS resolvidos (Regime Normal). No Simples são ignorados — CST 49. */
  pis?: NfePisCofinsInput | null;
  cofins?: NfePisCofinsInput | null;
  /**
   * IPI resolvido pelo emissor. Ausente/null → item sem bloco `IPI` no XML.
   * Vale para os dois regimes: IPI é imposto federal, independe de Simples.
   */
  ipi?: NfeIpiInput | null;
};

/**
 * Grupo `infAdic` já resolvido. Cada campo tem teto próprio no XSD (`infAdFisco`
 * 2000, `infCpl` 5000 na NF-e) — a validação da soma concatenada é feita pelo
 * emissor e reforçada aqui antes de montar.
 */
export type NfeAdditionalInfo = {
  infAdFisco?: string;
  infCpl?: string;
};

export type BuildNfeXmlInput = {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  /**
   * CNPJ/CPF autorizados a baixar o XML (`autXML`). Na prática a Bahia EXIGE o
   * escritório de contabilidade aqui — rejeição 486 sem ele, mesmo o schema
   * marcando o grupo como opcional.
   */
  authorizedDownloadDocuments?: readonly string[];
  emitter: NfeEmitter;
  /**
   * ⚠️ **Opcional apenas para modelo 65.** A NF-e exige destinatário; a NFC-e a
   * consumidor não identificado é o caso comum de balcão. O builder recusa a
   * ausência em modelo 55 — o tipo afrouxa, a regra não.
   */
  recipient?: NfeRecipient;
  series: string;
  number: string;
  operationNature: string;
  /** 1 = Saída (venda) — único suportado no v1; entrada é evolução futura. */
  operationType: '0' | '1';
  /** 1 = interna, 2 = interestadual, 3 = exterior. */
  destinationIndicator: '1' | '2' | '3';
  finalConsumer: boolean;
  /** 1 = presencial, 2 = internet, 3 = teleatendimento, 9 = outros. */
  presenceIndicator: '1' | '2' | '3' | '9';
  items: NfeItemInput[];
  /**
   * `tPag` único — caminho legado da NF-e, onde uma forma basta.
   *
   * ⚠️ Para NFC-e use `payments`: o cupom precisa de **várias formas** e de
   * troco, e este campo sozinho descarta as duas coisas.
   */
  paymentMethodCode: string;

  /**
   * Formas de pagamento do cupom, já validadas.
   *
   * ⚠️ Existe porque o XML emitido ignorava a lista: saía um `detPag` único com
   * o total da venda, mesmo quando o pedido trazia cartão + dinheiro.
   */
  payments?: readonly {
    method: string;
    amount: number;
    description?: string;
    /** `tpIntegra` do grupo `card`, só para `tPag` 03/04. */
    cardIntegration?: '1' | '2';
  }[];

  /** `vTroco` — um valor para a venda inteira, irmão de `detPag`. */
  changeAmount?: number;
  /**
   * Informações adicionais já resolvidas pelo emissor: `infAdFisco` (interesse
   * do fisco) e `infCpl` (interesse do contribuinte), concatenadas por destino.
   * Ausentes/vazias → o grupo `infAdic` **não** é emitido.
   */
  additionalInfo?: NfeAdditionalInfo;
  emissionDate?: Date;
  /**
   * `55` = NF-e (mercadoria), `65` = NFC-e (cupom fiscal ao consumidor).
   *
   * O mesmo XSD, o mesmo webservice e a mesma assinatura servem os dois — o
   * modelo muda o conteúdo e o documento impresso, não o transporte.
   */
  model?: FiscalModel;
  /**
   * `1` = normal, `9` = contingência offline.
   *
   * Contingência é o caminho **previsto em lei** para a indisponibilidade do
   * órgão, e o documento impresso precisa exibir a condição.
   */
  emissionType?: EmissionType;
};

export type FiscalModel = '55' | '65';
export type EmissionType = '1' | '9';

export type BuiltNfeXml = {
  xml: Buffer;
  accessKey: string;
};

const NFE_MODEL: FiscalModel = '55';
const NFE_SCHEMA_VERSION = '4.00';

/**
 * `tpImp` declara o formato de impressão do documento auxiliar.
 *
 * `1` é retrato (A4, DANFE da NF-e); `4` é o DANFE NFC-e. Não é cosmético:
 * declarar `1` num cupom afirma um formato que o papel impresso não tem.
 */
const PRINT_FORMAT_BY_MODEL: Record<FiscalModel, string> = {
  '55': '1',
  '65': '4',
};

function formatDecimal(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** Tetos do XSD da NF-e/NFC-e para o grupo `infAdic` (`TString`). */
const INF_AD_FISCO_MAX = 2000;
const INF_CPL_MAX = 5000;

/**
 * Rejeita caracteres de controle C0 ilegais em XML 1.0 (§2.2). São permitidos
 * apenas TAB (9), LF (10) e CR (13); ilegais: 0–8, 11, 12, 14–31. Emiti-los
 * produziria um documento fiscal **mal-formado**, que a SEFAZ/Sefin pode
 * recusar. Feito por código de caractere para não esbarrar no lint.
 */
function assertXmlSafeText(value: string, field: string): void {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isIllegal =
      code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
    if (isIllegal) {
      throw new Error(
        `${field} contém caractere de controle inválido para XML 1.0.`,
      );
    }
  }
}

/**
 * Monta o grupo `infAdic` na `xs:sequence` do XSD: `infAdFisco` antes de
 * `infCpl`. Retorna `{}` (grupo omitido) quando ambos vazios. Reforça o teto do
 * XSD (o emissor já valida a soma; aqui é defesa antes de transmitir).
 */
function buildInfAdicXml(
  info: NfeAdditionalInfo | undefined,
): Record<string, unknown> {
  const infAdFisco = info?.infAdFisco?.trim();
  const infCpl = info?.infCpl?.trim();
  if (!infAdFisco && !infCpl) return {};

  if (infAdFisco && infAdFisco.length > INF_AD_FISCO_MAX) {
    throw new Error(
      `infAdFisco excede o limite de ${INF_AD_FISCO_MAX} caracteres do XSD.`,
    );
  }
  if (infCpl && infCpl.length > INF_CPL_MAX) {
    throw new Error(
      `infCpl excede o limite de ${INF_CPL_MAX} caracteres do XSD.`,
    );
  }
  if (infAdFisco) assertXmlSafeText(infAdFisco, 'infAdFisco');
  if (infCpl) assertXmlSafeText(infCpl, 'infCpl');

  const infAdic: Record<string, string> = {};
  if (infAdFisco) infAdic.infAdFisco = infAdFisco;
  if (infCpl) infAdic.infCpl = infCpl;
  return { infAdic };
}

/**
 * `dhEmi` exige o padrão xs:dateTime com offset de fuso em horas completas
 * (`-03:00`, nunca `Z`/UTC) e sem milissegundos. Exportado porque `dhEvento`
 * (envEvento — cancelamento/CC-e, `soap-envelope.ts`) usa o mesmo formato.
 */
export function toNfeDateTime(date: Date): string {
  const localOffsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(date.getTime() - localOffsetMs);
  return `${local.toISOString().slice(0, 19)}-03:00`;
}

function toAddressXml(address: NfeAddress) {
  return {
    xLgr: address.street,
    nro: address.number,
    ...(address.complement ? { xCpl: address.complement } : {}),
    xBairro: address.district,
    cMun: address.cityCodeIbge,
    xMun: address.cityName,
    UF: address.uf,
    CEP: address.zipCode.replace(/\D/g, ''),
    cPais: '1058',
    xPais: 'Brasil',
  };
}

/**
 * Valor do ICMS do item: base (2 casas) × alíquota. Só é chamado no ramo
 * `ICMS00` (Regime Normal) e no total — já gated por `isSimplesNacional`.
 */
function icmsItemValue(item: NfeItemInput): number {
  const base = Number(formatDecimal(item.totalValue, 2));
  return (base * (item.icmsAliquota ?? 0)) / 100;
}

/** CST de IPI tributado (`IPITrib`, com `vBC`/`pIPI`/`vIPI`). */
const IPI_TRIBUTADO_CST = new Set<string>(['50', '99']);

/**
 * Valor do IPI do item: tributado (50/99) → base×alíquota; `IPINT` (51–55) ou
 * item sem IPI → 0. ⚠️ Usa a **mesma base arredondada a 2 casas** que
 * `buildIpiXml` (`vBC`), senão o total do documento divergiria da soma dos itens.
 */
function ipiItemValue(
  ipi: NfeIpiInput | null | undefined,
  rawBase: number,
): number {
  if (!ipi || !IPI_TRIBUTADO_CST.has(ipi.cst)) return 0;
  const base = Number(formatDecimal(rawBase, 2));
  return (base * (ipi.aliquota ?? 0)) / 100;
}

/**
 * Grupo `IPI` do item, na `xs:sequence` do XSD (TIpi): `cEnq` → choice(`IPITrib`
 * | `IPINT`). `IPITrib`: `CST` → `vBC` → `pIPI` → `vIPI`. `IPINT`: só `CST`.
 *
 * **Item sem `ipi` → `{}` (grupo omitido)**.
 */
function buildIpiXml(item: NfeItemInput): Record<string, unknown> {
  const ipi = item.ipi;
  if (!ipi) return {};

  const cEnq = ipi.cEnq.trim();
  if (IPI_TRIBUTADO_CST.has(ipi.cst)) {
    const base = formatDecimal(item.totalValue, 2);
    const aliquota = ipi.aliquota ?? 0;
    return {
      IPI: {
        cEnq,
        IPITrib: {
          CST: ipi.cst,
          vBC: base,
          pIPI: formatDecimal(aliquota, 4),
          vIPI: formatDecimal(ipiItemValue(ipi, item.totalValue), 2),
        },
      },
    };
  }

  // CST 51–55: não tributado, sem base/alíquota/valor.
  return {
    IPI: {
      cEnq,
      IPINT: { CST: ipi.cst },
    },
  };
}

function buildImpostoXml(item: NfeItemInput) {
  const orig = item.origem ?? '0';
  const base = formatDecimal(item.totalValue, 2);
  // Alíquota da UF de destino já resolvida pelo emissor. Ausente → 0.00.
  const aliquota = item.icmsAliquota ?? 0;
  const icms = item.csosn
    ? {
        ICMS: {
          [`ICMSSN${item.csosn}`]: {
            orig,
            CSOSN: item.csosn,
          },
        },
      }
    : {
        ICMS: {
          ICMS00: {
            orig,
            CST: item.cst ?? '00',
            modBC: '3',
            vBC: base,
            pICMS: formatDecimal(aliquota, 2),
            vICMS: formatDecimal(icmsItemValue(item), 2),
          },
        },
      };

  // PIS e COFINS são OBRIGATÓRIOS em toda NF-e — rejeição 745 sem o grupo do
  // PIS. Valem inclusive no Simples Nacional, onde as contribuições já saem no
  // DAS: o grupo existe para DECLARAR isso, não para cobrar.
  //
  // IPI entra ENTRE ICMS e PIS/COFINS na `xs:sequence` do `imposto`. Item sem
  // `ipi` → `buildIpiXml` retorna `{}` e o grupo é omitido. A ordem de inserção
  // das chaves é a ordem do XML.
  return { ...icms, ...buildIpiXml(item), ...buildPisCofinsXml(item) };
}

/** CST de PIS/COFINS tributado por alíquota (`PISAliq`/`COFINSAliq`). */
const PIS_COFINS_TRIBUTADO_CST = new Set(['01', '02']);

/**
 * Valor da contribuição do item: tributado (01/02) → base×alíquota; NT (04–09)
 * ou ausente → 0. ⚠️ Usa a **mesma base arredondada a 2 casas** que
 * `buildContributionXml` (`vBC`).
 */
function pisCofinsItemValue(
  contribution: NfePisCofinsInput | null | undefined,
  rawBase: number,
): number {
  if (!contribution) return 0;
  if (PIS_COFINS_TRIBUTADO_CST.has(contribution.cst)) {
    const base = Number(formatDecimal(rawBase, 2));
    return (base * (contribution.aliquota ?? 0)) / 100;
  }
  return 0;
}

/**
 * Um grupo `PIS`/`COFINS` do item, na `xs:sequence` do schema (CST → vBC →
 * alíquota → valor para o tributado; só CST para o NT).
 */
function buildContributionXml(
  kind: 'PIS' | 'COFINS',
  contribution: NfePisCofinsInput | null | undefined,
  base: string,
) {
  const aliqTag = kind === 'PIS' ? 'PISAliq' : 'COFINSAliq';
  const ntTag = kind === 'PIS' ? 'PISNT' : 'COFINSNT';
  const pTag = kind === 'PIS' ? 'pPIS' : 'pCOFINS';
  const vTag = kind === 'PIS' ? 'vPIS' : 'vCOFINS';

  // Ausente → fallback CST 01 zerado: produto sem grupo e sem padrão continua
  // emitindo. Nunca deixar de emitir por falta de config.
  if (!contribution) {
    return {
      [aliqTag]: { CST: '01', vBC: base, [pTag]: '0.00', [vTag]: '0.00' },
    };
  }

  if (PIS_COFINS_TRIBUTADO_CST.has(contribution.cst)) {
    const aliquota = contribution.aliquota ?? 0;
    const valor = (Number(base) * aliquota) / 100;
    return {
      [aliqTag]: {
        CST: contribution.cst,
        vBC: base,
        [pTag]: formatDecimal(aliquota, 4),
        [vTag]: formatDecimal(valor, 2),
      },
    };
  }

  // CST 04–09 (não tributado): sem base/alíquota/valor.
  return { [ntTag]: { CST: contribution.cst } };
}

/**
 * Grupos PIS/COFINS.
 *
 * **Simples Nacional** → `PISOutr`/`COFINSOutr` com CST 49 (Outras Operações) e
 * valores zerados: as contribuições são recolhidas no DAS, e a nota apenas
 * registra o fato.
 *
 * **Demais regimes** → apuração real: `PISAliq`/`COFINSAliq` com `vBC`,
 * `pPIS`/`pCOFINS` e `vPIS`/`vCOFINS` calculados sobre a base do item (CST
 * 01/02), ou `PISNT`/`COFINSNT` sem valores (CST 04–09). Sem esses dados →
 * fallback CST 01 zerado.
 *
 * Ordem dos elementos e `xs:sequence` (CST -> vBC -> alíquota -> valor): fora
 * dela o XML é recusado por schema antes da regra de negócio.
 */
function buildPisCofinsXml(item: NfeItemInput) {
  const base = formatDecimal(item.totalValue, 2);

  if (item.csosn) {
    return {
      PIS: { PISOutr: { CST: '49', vBC: base, pPIS: '0.00', vPIS: '0.00' } },
      COFINS: {
        COFINSOutr: {
          CST: '49',
          vBC: base,
          pCOFINS: '0.00',
          vCOFINS: '0.00',
        },
      },
    };
  }

  return {
    PIS: buildContributionXml('PIS', item.pis, base),
    COFINS: buildContributionXml('COFINS', item.cofins, base),
  };
}

/**
 * Constrói o XML da NF-e/NFC-e (modelo 55/65, layout 4.00) a partir dos dados já
 * validados/persistidos. Cobre os elementos exigidos pelo schema oficial
 * (nfe_v4.00.xsd) para uma operação de venda simples.
 */
export function buildNfeXml(input: BuildNfeXmlInput): BuiltNfeXml {
  const emissionDate = input.emissionDate ?? new Date();
  const cUF = input.emitter.address.cityCodeIbge.slice(0, 2);

  // cNF: código numérico do MOC — determinístico o suficiente para não colidir
  // dentro do mesmo segundo (últimos 8 dígitos do timestamp em ms).
  const cNF = String(emissionDate.getTime()).slice(-8).padStart(8, '0');

  const model = input.model ?? NFE_MODEL;
  const emissionType = input.emissionType ?? '1';

  // A NF-e sempre exigiu destinatário; o tipo passou a admitir ausência por
  // causa da NFC-e. Recusar aqui mantém a regra onde ela vale.
  if (model === '55' && !input.recipient) {
    throw new Error(
      'NF-e (modelo 55) exige destinatario. Ausencia so e admitida em NFC-e (modelo 65).',
    );
  }

  const { accessKey, cDV } = buildNfeAccessKey({
    cUF,
    emissionDate,
    cnpj: input.emitter.cnpj,
    // ⚠️ O modelo ocupa DUAS posições: `ide/mod` e os dígitos 21-22 da chave.
    // Parametrizar só uma produz chave que diz "55" num documento que se
    // declara "65" — e a SEFAZ rejeita a inconsistência.
    mod: model,
    series: input.series,
    number: input.number,
    tpEmis: emissionType,
    cNF,
  });

  const totalProdutos = input.items.reduce(
    (sum, item) => sum + item.totalValue,
    0,
  );

  const isSimplesNacional = input.emitter.taxRegimeCode === '1';

  // Totais de ICMS. No Simples são 0 (ICMSSN não tem base/valor de ICMS na
  // nota; o imposto sai no DAS). `vBC` = base declarada dos itens ICMS00.
  const totalIcmsBase = isSimplesNacional
    ? 0
    : input.items.reduce(
        (sum, item) => sum + Number(formatDecimal(item.totalValue, 2)),
        0,
      );
  const totalIcms = isSimplesNacional
    ? 0
    : input.items.reduce((sum, item) => sum + icmsItemValue(item), 0);

  // Totais de PIS/COFINS somam os itens. No Simples são 0 (CST 49, recolhido no
  // DAS). PIS/COFINS são "por dentro" do preço → não somam ao vNF.
  const totalPis = isSimplesNacional
    ? 0
    : input.items.reduce(
        (sum, item) => sum + pisCofinsItemValue(item.pis, item.totalValue),
        0,
      );
  const totalCofins = isSimplesNacional
    ? 0
    : input.items.reduce(
        (sum, item) => sum + pisCofinsItemValue(item.cofins, item.totalValue),
        0,
      );

  // Total de IPI: soma os itens com IPI tributado (50/99). IPI é federal → soma
  // nos dois regimes (não gated por Simples). Sem itens de IPI o total é 0.00.
  // IPI é "por fora" → soma ao vNF.
  const totalIpi = input.items.reduce(
    (sum, item) => sum + ipiItemValue(item.ipi, item.totalValue),
    0,
  );

  const nfeObject = {
    NFe: {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      infNFe: {
        '@Id': `NFe${accessKey}`,
        '@versao': NFE_SCHEMA_VERSION,
        ide: {
          cUF,
          cNF,
          natOp: input.operationNature,
          mod: model,
          serie: input.series,
          nNF: input.number,
          dhEmi: toNfeDateTime(emissionDate),
          tpNF: input.operationType,
          idDest: input.destinationIndicator,
          cMunFG: input.emitter.address.cityCodeIbge,
          tpImp: PRINT_FORMAT_BY_MODEL[model],
          tpEmis: emissionType,
          cDV,
          tpAmb: input.environment === 'PRODUCTION' ? '1' : '2',
          finNFe: '1',
          indFinal: input.finalConsumer ? '1' : '0',
          indPres: input.presenceIndicator,
          procEmi: '0',
          // maxLength 20 no schema oficial.
          verProc: 'febrahub-fiscal-v1',
        },
        emit: {
          CNPJ: input.emitter.cnpj,
          xNome: fitLayout(input.emitter.legalName, XNOME_MAX_LENGTH),
          enderEmit: toAddressXml(input.emitter.address),
          IE: input.emitter.stateRegistration.replace(/\D/g, ''),
          CRT: input.emitter.taxRegimeCode,
        },
        // Grupo AUSENTE quando não há destinatário — não presente e vazio.
        // Um `dest` vazio é rejeitado pelo schema; a NFC-e a consumidor não
        // identificado simplesmente omite o grupo.
        ...buildDestXml(input),
        ...buildAutXml(input.authorizedDownloadDocuments),
        det: input.items.map((item, index) => ({
          '@nItem': String(index + 1),
          prod: {
            cProd: String(index + 1).padStart(6, '0'),
            cEAN: 'SEM GTIN',
            // Máscara de homologação da NFC-e — ver `resolveItemDescription`.
            xProd: resolveItemDescription(input, item, index),
            NCM: item.ncm,
            CFOP: item.cfop,
            uCom: 'UN',
            qCom: formatDecimal(item.quantity, 4),
            vUnCom: formatDecimal(item.unitValue, 10),
            vProd: formatDecimal(item.totalValue, 2),
            cEANTrib: 'SEM GTIN',
            uTrib: 'UN',
            qTrib: formatDecimal(item.quantity, 4),
            vUnTrib: formatDecimal(item.unitValue, 10),
            indTot: '1',
          },
          imposto: buildImpostoXml({
            ...item,
            csosn: isSimplesNacional ? (item.csosn ?? '102') : null,
            cst: isSimplesNacional ? null : (item.cst ?? '00'),
          }),
        })),
        total: {
          ICMSTot: {
            vBC: formatDecimal(totalIcmsBase, 2),
            vICMS: formatDecimal(totalIcms, 2),
            vICMSDeson: '0.00',
            vFCP: '0.00',
            vBCST: '0.00',
            vST: '0.00',
            vFCPST: '0.00',
            vFCPSTRet: '0.00',
            vProd: formatDecimal(totalProdutos, 2),
            vFrete: '0.00',
            vSeg: '0.00',
            vDesc: '0.00',
            vII: '0.00',
            // IPI somado dos itens tributados. Sem IPI → 0.00. `vIPIDevol`
            // (devolução) segue fora de escopo.
            vIPI: formatDecimal(totalIpi, 2),
            vIPIDevol: '0.00',
            vPIS: formatDecimal(totalPis, 2),
            vCOFINS: formatDecimal(totalCofins, 2),
            vOutro: '0.00',
            // IPI é "por fora": integra o valor total da nota (rejeição 528 se o
            // somatório não bater). Sem IPI, `totalIpi=0` → `vNF` inalterado.
            vNF: formatDecimal(totalProdutos + totalIpi, 2),
          },
        },
        transp: {
          modFrete: '9',
        },
        pag: buildPagXml(input, totalProdutos),
        // `infAdic` entra após `pag` na sequência do XSD. Omitido quando não há
        // texto → XML idêntico ao de hoje.
        ...buildInfAdicXml(input.additionalInfo),
      },
    },
  };

  return {
    xml: buildXml(nfeObject),
    accessKey,
  };
}

/**
 * Razão social do destinatário em homologação.
 *
 * **Regra do leiaute, não escolha nossa**: em `tpAmb=2` a SEFAZ exige que
 * `dest/xNome` seja EXATAMENTE esta literal, e rejeita qualquer outro valor. É
 * o que impede uma nota de teste de parecer real.
 *
 * **Só o nome muda.** CPF/CNPJ, endereço e todo o resto seguem reais.
 */
const HOMOLOGATION_RECIPIENT_NAME =
  'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';

/**
 * Descrição obrigatória do **primeiro item** em homologação de NFC-e.
 *
 * ⚠️ **Confirmado pela SEFAZ, não deduzido.** No E2E o SVRS recusou com
 * `Rejeição 373 — Descrição do primeiro item diferente de NOTA FISCAL EMITIDA
 * EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL`.
 *
 * **Por que só na NFC-e**: na NF-e o marcador de "isto é teste" é o nome do
 * destinatário. O cupom normalmente **não tem destinatário**, então o órgão usa
 * a descrição do primeiro item no lugar.
 *
 * Texto exato, sem acento e em caixa alta: a comparação do órgão é literal.
 */
const HOMOLOGATION_FIRST_ITEM_DESCRIPTION =
  'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';

/**
 * Aplica a máscara de homologação ao primeiro item de uma NFC-e. Feita aqui e
 * não pedida ao chamador: o PDV não deve precisar conhecer regra de ambiente do
 * fisco.
 */
function resolveItemDescription(
  input: BuildNfeXmlInput,
  item: NfeItemInput,
  index: number,
): string {
  const isHomologationNfce =
    input.environment === 'HOMOLOGATION' && (input.model ?? NFE_MODEL) === '65';

  return isHomologationNfce && index === 0
    ? HOMOLOGATION_FIRST_ITEM_DESCRIPTION
    : item.description;
}

function resolveRecipientName(
  environment: 'HOMOLOGATION' | 'PRODUCTION',
  name: string,
): string {
  return environment === 'HOMOLOGATION' ? HOMOLOGATION_RECIPIENT_NAME : name;
}

/**
 * Grupo `pag`.
 *
 * Quando `payments` vem preenchido (NFC-e), emite **um `detPag` por forma** e o
 * `vTroco` da venda. Sem ele, mantém o comportamento legado da NF-e — um
 * `detPag` com o total.
 *
 * `vTroco` só aparece quando há troco: o XSD o define como opcional.
 */
function buildPagXml(
  input: BuildNfeXmlInput,
  totalProdutos: number,
): Record<string, unknown> {
  if (!input.payments?.length) {
    return {
      detPag: {
        tPag: input.paymentMethodCode,
        vPag: formatDecimal(totalProdutos, 2),
      },
    };
  }

  const detPag = input.payments.map((payment) => ({
    tPag: payment.method,
    vPag: formatDecimal(payment.amount, 2),
    // `xPag` é obrigatório quando `tPag` é 99 ("Outros").
    ...(payment.description ? { xPag: payment.description } : {}),
    // ⚠️ `card` é `minOccurs=0` no XSD, mas a SEFAZ **exige** em cartão
    // (rejeição 391). Schema válido não é o mesmo que aceito pelo órgão.
    ...(payment.cardIntegration
      ? { card: { tpIntegra: payment.cardIntegration } }
      : {}),
  }));

  return {
    detPag,
    ...(input.changeAmount && input.changeAmount > 0
      ? { vTroco: formatDecimal(input.changeAmount, 2) }
      : {}),
  };
}

/**
 * `dest` só existe quando há destinatário. Em NFC-e a consumidor não
 * identificado o grupo é **omitido**, não emitido vazio.
 */
function buildDestXml(input: BuildNfeXmlInput): Record<string, unknown> {
  const recipient = input.recipient;
  if (!recipient) return {};

  return {
    dest: {
      [recipient.documentType]: recipient.document.replace(/\D/g, ''),
      xNome: fitLayout(
        resolveRecipientName(input.environment, recipient.name),
        XNOME_MAX_LENGTH,
      ),
      ...(recipient.address
        ? { enderDest: toAddressXml(recipient.address) }
        : {}),
      indIEDest: '9',
    },
  };
}

/**
 * Grupo `autXML` — quem pode baixar o XML da nota.
 *
 * `xs:choice` entre `CNPJ` e `CPF`: mandar um CPF dentro de `<CNPJ>` é recusado
 * por schema, então a escolha é feita pelo tamanho (11 = CPF, 14 = CNPJ).
 *
 * O limite de 10 é do XSD (`maxOccurs="10"`).
 */
function buildAutXml(
  documents: readonly string[] | undefined,
): Record<string, unknown> {
  const cleaned = (documents ?? [])
    .map((document) => document.replace(/\D/g, ''))
    .filter((document) => document.length > 0);

  if (cleaned.length === 0) return {};
  if (cleaned.length > 10) {
    throw new Error(
      `Grupo autXML aceita no maximo 10 documentos (recebidos: ${cleaned.length})`,
    );
  }

  return {
    autXML: cleaned.map((document) =>
      document.length === 11 ? { CPF: document } : { CNPJ: document },
    ),
  };
}

/** `xNome` é limitado a 60 caracteres pelo leiaute (`maxLength` no XSD). */
const XNOME_MAX_LENGTH = 60;

/**
 * Corta um texto no limite do leiaute. Truncar aqui, e não recusar no cadastro,
 * é deliberado: razões sociais com mais de 60 caracteres são comuns no Brasil. A
 * razão social é fato jurídico da empresa e não deve ser mutilada no banco; o
 * limite é do documento fiscal, então é no documento que ele se aplica.
 */
function fitLayout(value: string, maxLength: number): string {
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}
