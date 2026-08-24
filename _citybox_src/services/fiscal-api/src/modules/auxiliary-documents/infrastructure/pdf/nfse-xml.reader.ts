import { convert } from 'xmlbuilder2';

/// Leitura do XML autorizado da NFS-e para os campos que o DANFSE imprime.
///
/// Separado do renderizador porque são duas responsabilidades com motivos de
/// mudança diferentes: o leiaute muda por decisão visual, a leitura muda quando
/// o Padrão Nacional revisa o schema. Misturá-las faria uma alteração de
/// espaçamento tocar o mesmo arquivo que a interpretação fiscal.
///
/// ⚠️ A estrutura tem **dois níveis**, e é isso que a torna traiçoeira: o Sefin
/// devolve um `NFSe`/`infNFSe` que **contém a DPS original** transmitida pelo
/// contribuinte. Número, chave e os **valores calculados** (`vBC`, `vISSQN`,
/// `vLiq`, `vTotalRet`) vêm do nível de fora (`infNFSe`); prestador, tomador,
/// serviço, descontos e retenções vêm da DPS aninhada. Ler tudo de um nível só
/// produz um documento pela metade — sem nenhum erro aparente.
///
/// Mapa completo dos elementos: `specs/erp/029-danfse-nt008-conformidade/data-model.md`
/// (confirmado contra `resources/xsd/nfse/1.01/`).

export type NfseAddress = {
  street: string;
  number?: string;
  complement?: string;
  district?: string;
  cityCode?: string;
  uf?: string;
  zipCode?: string;
};

/// Retenções federais (`trib > tribFed`). Cada linha é omitida quando o XML
/// não a traz — um `0,00` afirmaria que houve retenção zero, e ausência não é
/// zero (NT 008/2026; spec 029 R3).
export type NfseFederalTaxes = {
  pis?: number;
  cofins?: number;
  /// `vRetCP` — contribuição previdenciária (INSS) retida.
  inss?: number;
  irrf?: number;
  csll?: number;
};

/// Contato (telefone/e-mail) que o DANFSe v2.0 mostra por pessoa. Opcional —
/// célula em branco quando o XML não traz.
export type NfseContact = { phone?: string; email?: string };

export type NfseDocumentData = {
  accessKey: string;
  nfseNumber: string;
  issuedAt: string;
  cityName: string;
  /// Competência da NFS-e (`dCompet`, mês de referência).
  competencia?: string;
  /// Origem: a DPS que gerou a nota.
  dps?: { number?: string; series?: string; issuedAt?: string };
  /// Quem emitiu (`tpEmit`): Prestador / Tomador / Intermediário.
  emitterType?: string;
  provider: {
    cnpj: string;
    legalName: string;
    municipalRegistration?: string;
    address?: NfseAddress;
    contact?: NfseContact;
    /// Optante do Simples Nacional na competência (`opSimpNac` ≠ 1).
    simplesNacional?: boolean;
    /// Regime de apuração pelo SN (`regApTribSN`).
    taxRegimeSN?: string;
  };
  customer: {
    document: string;
    name: string;
    municipalRegistration?: string;
    address?: NfseAddress;
    contact?: NfseContact;
  };
  /// Só presente quando o XML traz o grupo `interm` (NT: seção omitida quando
  /// ausente).
  intermediary?: {
    document: string;
    name: string;
    address?: NfseAddress;
    contact?: NfseContact;
  };
  service: {
    description: string;
    nationalCode: string;
    municipalCode?: string;
    nbsCode?: string;
    provisionCity?: string;
    /// Tipo de tributação do ISSQN (`tribISSQN`), texto.
    issTaxType?: string;
    /// Município/UF de incidência do ISSQN (`cLocIncid`/`xLocIncid`).
    incidenceCity?: string;
    totalValue: number;
    issRate?: number;
    issValue: number;
    issWithheld: boolean;
  };
  amounts: {
    calculationBase?: number;
    deductions?: number;
    discounts?: number;
    netValue: number;
  };
  federalTaxes?: NfseFederalTaxes;
  totals?: { totalTaxes?: number; approxTaxPercent?: number };
};

type XmlNode = Record<string, unknown>;

function asNode(value: unknown): XmlNode | undefined {
  return value && typeof value === 'object' ? (value as XmlNode) : undefined;
}

/// Busca em profundidade pelo nome do elemento.
///
/// Deliberadamente tolerante à profundidade: o Padrão Nacional aninha
/// `infNFSe > DPS > infDPS > prest`, e amarrar o caminho completo faria a
/// leitura quebrar a cada revisão de schema que insira um nível. O nome dos
/// elementos é estável; a posição, não.
/// ⚠️ Devolve `unknown`, não `XmlNode`.
///
/// O `xmlbuilder2` representa um elemento **de texto simples** como string
/// (`<nNFSe>1</nNFSe>` vira `{ nNFSe: '1' }`) e um elemento **com filhos ou
/// atributos** como objeto. Uma versão anterior desta função filtrava por
/// objeto e devolvia `undefined` para todo campo folha — o DANFSE saía com os
/// rótulos certos e **todos os valores em branco**, sem erro nenhum. É o tipo
/// de defeito que só aparece olhando o documento.
function find(node: unknown, name: string): unknown {
  const current = asNode(node);
  if (!current) return undefined;

  if (name in current) return firstOf(current[name]);

  for (const value of Object.values(current)) {
    const found = find(firstOf(value), name);
    if (found !== undefined) return found;
  }

  return undefined;
}

/// Elemento repetido vira array no `xmlbuilder2`; único vira valor. Todos os
/// campos que o DANFSE lê são únicos, então a primeira ocorrência basta.
///
/// Tipado como `unknown[]` de propósito: `Array.isArray` sobre `unknown`
/// estreita para `any[]`, e `any` está proibido neste projeto.
function firstOf(value: unknown): unknown {
  return Array.isArray(value) ? (value as unknown[])[0] : value;
}

function text(node: unknown, name: string): string {
  const found = find(node, name);
  if (found === undefined || found === null) return '';

  if (typeof found === 'string' || typeof found === 'number') {
    return String(found);
  }

  // Elemento com atributos guarda o texto em `#`.
  const inner = asNode(found)?.['#'];
  return typeof inner === 'string' || typeof inner === 'number'
    ? String(inner)
    : '';
}

/// Lê atributo XML (`@Nome` na representação do `xmlbuilder2`) sem cair em
/// `any`. Ver a nota sobre `noImplicitAny` no ponto de uso.
function attr(node: unknown, name: string): string {
  const value = asNode(node)?.[`@${name}`];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function number(node: unknown, name: string): number {
  const raw = text(node, name);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/// Como `number`, mas devolve `undefined` quando o elemento **não existe** no
/// XML — a diferença entre "não informado" e "zero" (spec 029 R3). Campo
/// numérico opcional (BC, deduções, retenções, totais) usa esta variante para
/// que o renderizador saiba quando omitir a linha.
function numberOrUndefined(node: unknown, name: string): number | undefined {
  const raw = text(node, name);
  if (raw === '') return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/// Monta o endereço a partir de um nó `enderNac`/`end`. Devolve `undefined`
/// quando o grupo não existe ou não tem logradouro/bairro/município — o
/// renderizador então omite a linha de endereço (R3).
function readAddress(node: unknown): NfseAddress | undefined {
  if (!asNode(node)) return undefined;

  const street = text(node, 'xLgr');
  const district = text(node, 'xBairro');
  const cityCode = text(node, 'cMun');
  if (!street && !district && !cityCode) return undefined;

  return {
    street,
    number: text(node, 'nro') || undefined,
    complement: text(node, 'xCpl') || undefined,
    district: district || undefined,
    cityCode: cityCode || undefined,
    uf: text(node, 'UF') || undefined,
    zipCode: text(node, 'CEP') || undefined,
  };
}

/// Lê as retenções federais do grupo `tribFed`. PIS/COFINS vivem no subgrupo
/// `piscofins`; IRRF/CSLL/CP(INSS) são filhos diretos. Devolve `undefined`
/// quando o grupo inteiro está ausente **ou** vazio, para o renderizador
/// omitir a seção (NT: sem zeros falsos).
function readFederalTaxes(node: unknown): NfseFederalTaxes | undefined {
  if (!asNode(node)) return undefined;

  const pisCofins = find(node, 'piscofins');
  const taxes: NfseFederalTaxes = {
    pis: numberOrUndefined(pisCofins, 'vPis'),
    cofins: numberOrUndefined(pisCofins, 'vCofins'),
    inss: numberOrUndefined(node, 'vRetCP'),
    irrf: numberOrUndefined(node, 'vRetIRRF'),
    csll: numberOrUndefined(node, 'vRetCSLL'),
  };

  const hasAny = Object.values(taxes).some((value) => value !== undefined);
  return hasAny ? taxes : undefined;
}

/// Soma as folhas nomeadas de um grupo, devolvendo `undefined` quando nenhuma
/// existe. Usado para os grupos `vTotTrib*`/`pTotTrib*` da transparência.
function sumParts(node: unknown, names: string[]): number | undefined {
  const present = names
    .map((name) => numberOrUndefined(node, name))
    .filter((value): value is number => value !== undefined);
  return present.length > 0
    ? present.reduce((sum, value) => sum + value, 0)
    : undefined;
}

/// Lê a transparência tributária (`totTrib`, Lei 12.741/2012). O XSD é um
/// `xs:choice` de **quatro** alternativas, e cada uma exige leitura diferente:
///
/// - `vTotTrib` → grupo `vTotTribFed/Est/Mun` (valor R$): soma dos três.
/// - `pTotTrib` → grupo `pTotTribFed/Est/Mun` (percentual): soma dos três.
/// - `pTotTribSN` → **escalar** percentual do Simples Nacional (o caso comum).
/// - `indTotTrib` → fixo "0" ("não informar"): nada a exibir → seção omitida.
///
/// ⚠️ `pTotTrib` é **grupo**, não escalar — lê-lo direto com `numberOrUndefined`
/// devolvia sempre `undefined` (o nó é objeto, sem texto `#`), sumindo a seção
/// para quem usa a variante percentual. Cada folha é lida pelo nome.
function readTotals(
  node: unknown,
): { totalTaxes?: number; approxTaxPercent?: number } | undefined {
  if (!asNode(node)) return undefined;

  const totalTaxes = sumParts(node, [
    'vTotTribFed',
    'vTotTribEst',
    'vTotTribMun',
  ]);
  // Simples Nacional traz o percentual único `pTotTribSN`; senão, soma o grupo
  // percentual por esfera.
  const approxTaxPercent =
    numberOrUndefined(node, 'pTotTribSN') ??
    sumParts(node, ['pTotTribFed', 'pTotTribEst', 'pTotTribMun']);

  if (totalTaxes === undefined && approxTaxPercent === undefined) {
    return undefined;
  }
  return { totalTaxes, approxTaxPercent };
}

/// `tpEmit` → quem emitiu a NFS-e (DANFSe v2.0: "EMITENTE DA NFS-e").
function emitterTypeLabel(code: string): string | undefined {
  const map: Record<string, string> = {
    '1': 'Prestador',
    '2': 'Tomador',
    '3': 'Intermediário',
  };
  return map[code];
}

/// `tribISSQN` → tipo de tributação do ISSQN (DANFSe v2.0).
function issTaxTypeLabel(code: string): string | undefined {
  const map: Record<string, string> = {
    '1': 'Operação tributável',
    '2': 'Imunidade',
    '3': 'Exportação de serviço',
    '4': 'Não incidência',
  };
  return map[code];
}

/// Contato (fone/email) → `undefined` quando nenhum dos dois existe.
function readContact(node: unknown): NfseContact | undefined {
  const phone = text(node, 'fone') || undefined;
  const email = text(node, 'email') || undefined;
  return phone || email ? { phone, email } : undefined;
}

export function readNfseXml(xml: Buffer): NfseDocumentData {
  const root = convert(xml.toString('utf-8'), { format: 'object' }) as XmlNode;

  const infNfse = find(root, 'infNFSe') ?? root;
  const dps = find(infNfse, 'infDPS') ?? infNfse;
  // ⚠️ Dois lugares para os dados do prestador, e o de fora é o que tem o nome.
  // A DPS transmitida não pode conter `xNome` do prestador — o Sefin rejeita
  // com `E0121`, deduzindo a razão social pelo CNPJ. Quem preenche é o próprio
  // Sefin, no grupo `emit` do `infNFSe`. Ler só o `prest` da DPS produz um
  // DANFSE sem o nome de quem prestou o serviço.
  const issuer = find(infNfse, 'emit');
  const provider = find(dps, 'prest') ?? {};
  const customer = find(dps, 'toma') ?? {};
  const service = find(dps, 'serv') ?? {};
  // `valores` da DPS (TCInfoValores): valor do serviço, descontos, tributos.
  const dpsValues = find(dps, 'valores') ?? {};
  // `valores` do `infNFSe` (TCValoresNFSe): valores CALCULADOS pelo Sefin
  // (base de cálculo, ISSQN, retenções totais, líquido). Fonte de verdade do
  // que foi autorizado — não recalcular a partir da DPS.
  const nfseValues = find(infNfse, 'valores') ?? {};
  const tribMun = find(dpsValues, 'tribMun');
  const federalTaxes = readFederalTaxes(find(dpsValues, 'tribFed'));
  const totals = readTotals(find(dpsValues, 'totTrib'));
  const intermediaryNode = find(dps, 'interm');

  // A chave vive no atributo `Id` do `infNFSe`, prefixada com "NFS" — o mesmo
  // padrão do `Id` da NF-e. Sem remover o prefixo, o código de barras receberia
  // 53 caracteres e falharia a validação de 50 dígitos.
  //
  // Via `attr()` e não `infNfse['@Id']`: indexar um `unknown` direto produziria
  // `any` implícito. O `tsconfig` deste serviço tem `noImplicitAny: false`, de
  // modo que o compilador **não** pegaria — e o resto deste arquivo evita `any`
  // de propósito.
  const rawId = attr(infNfse, 'Id');

  // Alíquota e retenção do ISS vivem em `valores > trib > tribMun`, **não** no
  // grupo `serv`. Ler do `serv` (como uma versão anterior fazia) devolvia
  // alíquota vazia sempre que ela existia.
  const issRate = numberOrUndefined(tribMun, 'pAliq');
  const totalValue = number(dpsValues, 'vServ') || number(dps, 'vServ');
  // `tpRetISSQN`: 2 = retido pelo tomador, 3 = retido pelo intermediário.
  // Ausente ou 1 = não retido (o caso comum no Simples Nacional).
  const issRetentionType = text(tribMun, 'tpRetISSQN');
  const issWithheld = issRetentionType === '2' || issRetentionType === '3';
  // ISSQN calculado pelo Sefin quando disponível; senão, a partir da alíquota.
  const issValue =
    numberOrUndefined(nfseValues, 'vISSQN') ??
    (issRate ? totalValue * (issRate / 100) : 0);

  const discountIncond = numberOrUndefined(dpsValues, 'vDescIncond');
  const discountCond = numberOrUndefined(dpsValues, 'vDescCond');
  const discounts =
    discountIncond === undefined && discountCond === undefined
      ? undefined
      : (discountIncond ?? 0) + (discountCond ?? 0);

  const intermediary = asNode(intermediaryNode)
    ? {
        document:
          text(intermediaryNode, 'CNPJ') || text(intermediaryNode, 'CPF'),
        name: text(intermediaryNode, 'xNome'),
        address: readAddress(find(intermediaryNode, 'end')),
        contact: readContact(intermediaryNode),
      }
    : undefined;

  // Regime do Simples Nacional (grupo `regTrib` da DPS). `opSimpNac`: 1 = não
  // optante, 2 = MEI, 3 = ME/EPP. `regApTribSN` traz o regime de apuração.
  const opSimpNac = text(provider, 'opSimpNac');
  const regApTribSN = text(provider, 'regApTribSN') || undefined;

  return {
    accessKey: rawId.replace(/\D/g, ''),
    nfseNumber: text(infNfse, 'nNFSe'),
    issuedAt: text(infNfse, 'dhProc') || text(dps, 'dhEmi'),
    cityName: text(infNfse, 'xLocEmi') || text(infNfse, 'xLocPrestacao'),
    competencia: text(dps, 'dCompet') || undefined,
    dps: {
      number: text(dps, 'nDPS') || undefined,
      series: text(dps, 'serie') || undefined,
      issuedAt: text(dps, 'dhEmi') || undefined,
    },
    emitterType: emitterTypeLabel(text(dps, 'tpEmit')),
    provider: {
      cnpj: text(issuer, 'CNPJ') || text(provider, 'CNPJ'),
      legalName: text(issuer, 'xNome') || text(provider, 'xNome'),
      municipalRegistration:
        text(issuer, 'IM') || text(provider, 'IM') || undefined,
      address: readAddress(find(issuer, 'enderNac')),
      contact: readContact(issuer),
      simplesNacional: opSimpNac ? opSimpNac !== '1' : undefined,
      taxRegimeSN: regApTribSN,
    },
    customer: {
      document: text(customer, 'CNPJ') || text(customer, 'CPF'),
      name: text(customer, 'xNome'),
      municipalRegistration: text(customer, 'IM') || undefined,
      address: readAddress(find(customer, 'end')),
      contact: readContact(customer),
    },
    intermediary,
    service: {
      description: text(service, 'xDescServ') || text(service, 'xServ'),
      nationalCode: text(service, 'cTribNac'),
      municipalCode: text(service, 'cTribMun') || undefined,
      nbsCode: text(service, 'cNBS') || undefined,
      provisionCity: text(infNfse, 'xLocPrestacao') || undefined,
      issTaxType: issTaxTypeLabel(text(tribMun, 'tribISSQN')),
      incidenceCity:
        text(infNfse, 'xLocIncid') || text(infNfse, 'cLocIncid') || undefined,
      totalValue,
      issRate,
      issValue,
      issWithheld,
    },
    amounts: {
      calculationBase: numberOrUndefined(nfseValues, 'vBC'),
      deductions: numberOrUndefined(nfseValues, 'vCalcDR'),
      discounts,
      netValue: numberOrUndefined(nfseValues, 'vLiq') ?? totalValue,
    },
    federalTaxes,
    totals,
  };
}
