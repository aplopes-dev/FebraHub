import {
  extractElementXml,
  readElementText,
} from '../../../../shared/infra/fiscal-soap/nfe-soap-response';
import { toNfeDateTime } from '../../../nfe/infrastructure/xml/nfe-xml.builder';

const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';
const NFE_VERSION = '4.00';
const NFE_EVENT_VERSION = '1.00';

function toTpAmb(environment: 'HOMOLOGATION' | 'PRODUCTION'): '1' | '2' {
  return environment === 'PRODUCTION' ? '1' : '2';
}

/// Monta o `<enviNFe>` (lote de autorização, sempre `indSinc=1` — processamento
/// síncrono, consistente com FR-016/a decisão de chamada síncrona do resto da
/// API) embrulhando o XML já assinado da `<NFe>` (T035). Padrão nacional
/// estável desde a NF-e 3.10 — ver cabeçalho de `NFeAutorizacao4.wsdl`.
/// Remove a declaração `<?xml ...?>` de um documento que será EMBUTIDO em
/// outro. Um XML só pode ter uma declaração, e ela só é válida no início do
/// documento — embutir com a declaração intacta produz um envelope malformado
/// que o IIS da SEFAZ recusa com HTTP 400, antes de qualquer processamento
/// SOAP. O sintoma (400 Bad Request, corpo "Bad Request") não aponta para a
/// causa, então centralizar aqui evita a reincidência.
function stripXmlDeclaration(xml: string): string {
  return xml.replace(/^\s*<\?xml[^?]*\?>\s*/, '');
}

export function buildEnviNfeXml(input: {
  idLote: string;
  signedNfeXml: string;
}): string {
  return (
    `<enviNFe xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSION}">` +
    `<idLote>${input.idLote}</idLote>` +
    `<indSinc>1</indSinc>` +
    stripXmlDeclaration(input.signedNfeXml) +
    `</enviNFe>`
  );
}

/// Monta o `<consSitNFe>` para `NFeConsultaProtocolo4.nfeConsultaNF`.
export function buildConsultaProtocoloXml(input: {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  accessKey: string;
}): string {
  return (
    `<consSitNFe xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSION}">` +
    `<tpAmb>${toTpAmb(input.environment)}</tpAmb>` +
    `<xServ>CONSULTAR</xServ>` +
    `<chNFe>${input.accessKey}</chNFe>` +
    `</consSitNFe>`
  );
}

/// `consStatServ` — consulta de disponibilidade do serviço (spec fiscal/001).
/// `cUF` é o código IBGE do estado do emitente (2 dígitos); Bahia = 29.
export function buildConsStatServXml(input: {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  cUF: string;
}): string {
  return (
    `<consStatServ xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSION}">` +
    `<tpAmb>${toTpAmb(input.environment)}</tpAmb>` +
    `<cUF>${input.cUF}</cUF>` +
    `<xServ>STATUS</xServ>` +
    `</consStatServ>`
  );
}

export type SefazStatusServResult = {
  /// `cStat` bruto do `retConsStatServ` (ex.: "107" em operação).
  cStat: string;
  /// `xMotivo` — mensagem do órgão, literal (FR-006).
  xMotivo: string | null;
  /// `dhRetorno` quando o órgão informa previsão de retorno (FR-006).
  dhRetorno: Date | null;
};

/// Extrai `cStat`/`xMotivo`/`dhRetorno` do `retConsStatServ`. Best-effort na
/// leitura — se o corpo não trouxer `cStat`, devolve string vazia e o chamador
/// trata como resposta não compreendida.
export function parseRetConsStatServXml(xml: string): SefazStatusServResult {
  const read = (tag: string): string | null => {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
    return match ? match[1] : null;
  };
  const dhRaw = read('dhRetorno');
  const parsedDh = dhRaw ? new Date(dhRaw) : null;
  return {
    cStat: read('cStat') ?? '',
    xMotivo: read('xMotivo'),
    dhRetorno: parsedDh && !Number.isNaN(parsedDh.getTime()) ? parsedDh : null,
  };
}

export type SefazProtocolResult =
  | {
      /// AUTHORIZED: o protocolo (`nProt`) confirma a autorização de uso.
      status: 'AUTHORIZED';
      protocol: string;
      accessKey: string;
      /// `<NFe>` + `<protNFe>` combinados em `<nfeProc>` — o formato padrão
      /// de arquivamento do "XML autorizado" (distinto do XML apenas
      /// assinado, que não carrega o protocolo).
      authorizedXml: string;
    }
  | {
      /// DENIED: irregularidade fiscal do emitente (cStat 110) — situação
      /// distinta de uma rejeição comum (XML/schema/regra de negócio).
      status: 'DENIED';
      errorCode: string;
      errorMessage: string;
    }
  | { status: 'REJECTED'; errorCode: string; errorMessage: string }
  | { status: 'SYNC_REQUIRED' };

/// Lê `cStat`/`xMotivo` de dentro de um sub-elemento específico (ex.:
/// `infProt`), isolando-o primeiro via `extractElementXml` — evita XPaths
/// ambíguos quando o mesmo nome de campo aparece em mais de um nível do
/// documento (ex.: `retEnviNFe` tem `cStat` no lote E dentro de `infProt`).
function readScopedStatus(
  xml: string,
  scopeLocalName: string,
): { cStat: string | null; xMotivo: string | null } {
  const scopedXml = extractElementXml(xml, scopeLocalName);
  if (!scopedXml) return { cStat: null, xMotivo: null };
  return {
    cStat: readElementText(scopedXml, 'cStat'),
    xMotivo: readElementText(scopedXml, 'xMotivo'),
  };
}

/// Interpreta o `<retEnviNFe>` (resposta de `nfeAutorizacaoLote`, indSinc=1).
/// Não modela a tabela completa de códigos `cStat` (centenas de valores
/// possíveis) — apenas os casos documentados e estáveis: 104 (lote
/// processado) + infProt.cStat 100 (autorizado) ou 110 (denegado); 105 (lote
/// ainda em processamento, deveria ser raro com indSinc=1) vira
/// SYNC_REQUIRED; qualquer outro cStat vira REJECTED com o código/motivo
/// disponível — falha fechado (nunca assume sucesso silenciosamente).
export function parseRetEnviNfeXml(
  retEnviNfeXml: string,
  signedNfeXml: string,
): SefazProtocolResult {
  const loteCStat = readElementText(retEnviNfeXml, 'cStat');
  const loteXMotivo = readElementText(retEnviNfeXml, 'xMotivo') ?? '';

  if (loteCStat === '105') {
    return { status: 'SYNC_REQUIRED' };
  }

  if (loteCStat !== '104') {
    return {
      status: 'REJECTED',
      errorCode: loteCStat ?? 'DESCONHECIDO',
      errorMessage: loteXMotivo || 'Lote rejeitado pela SEFAZ',
    };
  }

  const { cStat: protCStat, xMotivo: protXMotivo } = readScopedStatus(
    retEnviNfeXml,
    'infProt',
  );
  const nProt = readElementText(retEnviNfeXml, 'nProt');
  const chNFe = readElementText(retEnviNfeXml, 'chNFe');

  if (protCStat === '100' && nProt && chNFe) {
    return {
      status: 'AUTHORIZED',
      protocol: nProt,
      accessKey: chNFe,
      authorizedXml: buildNfeProcXml(signedNfeXml, retEnviNfeXml),
    };
  }

  if (protCStat === '110') {
    return {
      status: 'DENIED',
      errorCode: protCStat,
      errorMessage: protXMotivo || 'Uso denegado pela SEFAZ',
    };
  }

  return {
    status: 'REJECTED',
    errorCode: protCStat ?? loteCStat,
    errorMessage: protXMotivo || loteXMotivo || 'Rejeitado pela SEFAZ',
  };
}

/// Interpreta o `<retConsSitNFe>` (resposta de `nfeConsultaNF`). Mesma
/// política de "falha fechado" de `parseRetEnviNfeXml` para códigos não
/// mapeados.
export function parseRetConsSitNfeXml(
  retConsSitNfeXml: string,
): SefazProtocolResult {
  const cStat = readElementText(retConsSitNfeXml, 'cStat');
  const xMotivo = readElementText(retConsSitNfeXml, 'xMotivo') ?? '';
  const nProt = readElementText(retConsSitNfeXml, 'nProt');
  const chNFe = readElementText(retConsSitNfeXml, 'chNFe');

  if (cStat === '100' && nProt && chNFe) {
    return {
      status: 'AUTHORIZED',
      protocol: nProt,
      accessKey: chNFe,
      authorizedXml: retConsSitNfeXml,
    };
  }

  if (cStat === '110') {
    return {
      status: 'DENIED',
      errorCode: cStat,
      errorMessage: xMotivo || 'Uso denegado pela SEFAZ',
    };
  }

  return {
    status: 'REJECTED',
    errorCode: cStat ?? 'DESCONHECIDO',
    errorMessage: xMotivo || 'Não foi possível confirmar a situação da NF-e',
  };
}

/// Combina o XML já assinado da `<NFe>` com o `<protNFe>` extraído da
/// resposta em um `<nfeProc>` — formato padrão nacional de arquivamento do
/// XML autorizado (o que a maioria dos emissores/contadores espera
/// receber), não apenas o XML assinado sem o protocolo.
function buildNfeProcXml(signedNfeXml: string, retEnviNfeXml: string): string {
  const protNFeXml = extractElementXml(retEnviNfeXml, 'protNFe');
  return (
    `<nfeProc xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSION}">` +
    stripXmlDeclaration(signedNfeXml) +
    (protNFeXml ?? '') +
    `</nfeProc>`
  );
}

// ---------------------------------------------------------------------------
// Eventos (cancelamento/carta de correção — T063/T064/T068).
//
// ATENÇÃO — igual ao restante deste arquivo, mas com uma ressalva adicional:
// diferente de `buildEnviNfeXml`/`buildConsultaProtocoloXml` (cujo formato
// veio do XSD oficial fornecido pelo usuário em
// specs/002-fiscal-api/contracts/NFe/), a estrutura de evento abaixo
// (envEvento/evento/infEvento/detEvento) NÃO foi verificada contra um XSD
// oficial neste ambiente — essa pasta não inclui os XSDs de evento
// (envEvento_v1.00.xsd/evCancNFe_v1.00.xsd/evCCeNFe_v1.00.xsd). Reproduz de
// memória o leiaute nacional estável (documentado publicamente desde a NF-e
// 3.10, idêntico para cancelamento tpEvento=110111 e carta de correção
// tpEvento=110110 — só o conteúdo de `detEvento` muda). Decisão explícita do
// usuário: prosseguir best-effort, mesmo padrão já usado para
// `resources/wsdl/nfe/*.wsdl`. Confirmar contra o XSD oficial antes do
// primeiro teste real em homologação.
// ---------------------------------------------------------------------------

export type NfeEventKind = 'CANCEL' | 'CORRECTION_LETTER';

const EVENT_TYPE_CODE: Record<NfeEventKind, string> = {
  CANCEL: '110111',
  CORRECTION_LETTER: '110110',
};

const EVENT_DESCRIPTION: Record<NfeEventKind, string> = {
  CANCEL: 'Cancelamento',
  CORRECTION_LETTER: 'Carta de Correção',
};

/// Texto fixo de "condições de uso" da CC-e — conteúdo padrão exigido pelo
/// leiaute nacional (reproduzido de memória, mesma ressalva acima).
const CCE_COND_USO =
  'A Carta de Correção é disciplinada pelo § 1º-A do art. 7º do Convênio ' +
  'S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularização ' +
  'de erro ocorrido na emissão de documento fiscal, desde que o erro não ' +
  'esteja relacionado com: I - as variáveis que determinam o valor do ' +
  'imposto tais como: base de cálculo, alíquota, diferença de preço, ' +
  'quantidade, valor da operação ou da prestação; II - a correção de dados ' +
  'cadastrais que implique mudança do remetente ou do destinatário; III - ' +
  'a data de emissão ou de saída.';

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type BuildNfeEventXmlInput = {
  eventKind: NfeEventKind;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  /// Chave de acesso (44 dígitos) da NF-e alvo do evento.
  accessKey: string;
  cnpj: string;
  /// Número de sequência do evento para essa NF-e/tipo (1, 2, 3...).
  sequence: number;
  eventDateTime: Date;
  /// Obrigatório para CANCEL — protocolo de autorização original.
  protocol?: string;
  /// Obrigatório para CANCEL.
  justification?: string;
  /// Obrigatório para CORRECTION_LETTER.
  correctionText?: string;
};

/// Monta o `<evento>` (ainda não assinado — quem chama assina com
/// `signXml`/perfil `NFE_SEFAZ`, referenciando `infEvento` via `Id`, igual a
/// `infNFe`) para cancelamento ou carta de correção.
export function buildNfeEventXml(input: BuildNfeEventXmlInput): {
  unsignedEventoXml: string;
  eventId: string;
} {
  const tpEvento = EVENT_TYPE_CODE[input.eventKind];
  // DOIS formatos para o mesmo numero, e confundi-los e rejeicao da SEFAZ:
  //
  // - No `Id` do evento a sequencia ocupa 2 posicoes fixas (`ID` + tpEvento(6)
  //   + chave(44) + seq(2) = 54 chars), entao vai com zero a esquerda.
  // - No elemento `<nSeqEvento>` o pattern e `[1-9][0-9]?` — zero a esquerda e
  //   INVALIDO. "Falha no schema XML - The value '01' is invalid ... The
  //   Pattern constraint failed", verificado contra a SEFAZ-BA em 2026-08-07.
  const nSeqEventoNoId = String(input.sequence).padStart(2, '0');
  const nSeqEvento = String(input.sequence);
  const eventId = `ID${tpEvento}${input.accessKey}${nSeqEventoNoId}`;
  // cOrgao (código da UF do órgão autor) = os 2 primeiros dígitos da própria
  // chave de acesso (cUF) — mesmo campo, sem precisar de outra fonte.
  const cOrgao = input.accessKey.slice(0, 2);

  const detEventoBody =
    input.eventKind === 'CANCEL'
      ? `<descEvento>${EVENT_DESCRIPTION.CANCEL}</descEvento>` +
        `<nProt>${input.protocol ?? ''}</nProt>` +
        `<xJust>${escapeXmlText(input.justification ?? '')}</xJust>`
      : `<descEvento>${EVENT_DESCRIPTION.CORRECTION_LETTER}</descEvento>` +
        `<xCorrecao>${escapeXmlText(input.correctionText ?? '')}</xCorrecao>` +
        `<xCondUso>${escapeXmlText(CCE_COND_USO)}</xCondUso>`;

  const infEvento =
    `<infEvento Id="${eventId}">` +
    `<cOrgao>${cOrgao}</cOrgao>` +
    `<tpAmb>${toTpAmb(input.environment)}</tpAmb>` +
    `<CNPJ>${input.cnpj}</CNPJ>` +
    `<chNFe>${input.accessKey}</chNFe>` +
    `<dhEvento>${toNfeDateTime(input.eventDateTime)}</dhEvento>` +
    `<tpEvento>${tpEvento}</tpEvento>` +
    `<nSeqEvento>${nSeqEvento}</nSeqEvento>` +
    `<verEvento>${NFE_EVENT_VERSION}</verEvento>` +
    `<detEvento versao="${NFE_EVENT_VERSION}">${detEventoBody}</detEvento>` +
    `</infEvento>`;

  return {
    unsignedEventoXml: `<evento xmlns="${NFE_NAMESPACE}" versao="${NFE_EVENT_VERSION}">${infEvento}</evento>`,
    eventId,
  };
}

/// Monta o `<envEvento>` (lote de evento, sempre 1 evento por lote — igual à
/// prática padrão de mercado) embrulhando o `<evento>` já assinado, para
/// `NFeRecepcaoEvento4.nfeRecepcaoEvento`.
export function buildEnvEventoXml(input: {
  idLote: string;
  signedEventoXml: string;
}): string {
  return (
    `<envEvento xmlns="${NFE_NAMESPACE}" versao="${NFE_EVENT_VERSION}">` +
    `<idLote>${input.idLote}</idLote>` +
    input.signedEventoXml +
    `</envEvento>`
  );
}

export type SefazEventResult =
  | {
      /// cStat 135 ("Evento registrado e vinculado a NF-e") — o único código
      /// de sucesso documentado de forma estável para este webservice.
      status: 'AUTHORIZED';
      protocol: string;
      responseXml: string;
    }
  | { status: 'REJECTED'; errorCode: string; errorMessage: string };

/// Interpreta o `<retEnvEvento>` (resposta de `nfeRecepcaoEvento`). Mesma
/// política de "falha fechado" de `parseRetEnviNfeXml` para códigos não
/// mapeados — cStat 128 no lote confirma só que o LOTE foi processado; o
/// resultado de negócio do evento em si está em `retEvento/infEvento/cStat`.
export function parseRetEnvEventoXml(
  retEnvEventoXml: string,
): SefazEventResult {
  const loteCStat = readElementText(retEnvEventoXml, 'cStat');
  const loteXMotivo = readElementText(retEnvEventoXml, 'xMotivo') ?? '';

  if (loteCStat !== '128') {
    return {
      status: 'REJECTED',
      errorCode: loteCStat ?? 'DESCONHECIDO',
      errorMessage: loteXMotivo || 'Lote de evento rejeitado pela SEFAZ',
    };
  }

  const infEventoXml = extractElementXml(retEnvEventoXml, 'infEvento');
  const eventCStat = infEventoXml
    ? readElementText(infEventoXml, 'cStat')
    : null;
  const eventXMotivo = infEventoXml
    ? readElementText(infEventoXml, 'xMotivo')
    : null;
  const nProt = infEventoXml ? readElementText(infEventoXml, 'nProt') : null;

  if (eventCStat === '135' && nProt) {
    return {
      status: 'AUTHORIZED',
      protocol: nProt,
      responseXml: retEnvEventoXml,
    };
  }

  return {
    status: 'REJECTED',
    errorCode: eventCStat ?? loteCStat,
    errorMessage: eventXMotivo || loteXMotivo || 'Evento rejeitado pela SEFAZ',
  };
}

// ---------------------------------------------------------------------------
// Inutilização (T065/T068) — mesma ressalva de "best-effort, não verificado
// contra XSD oficial" do bloco de eventos acima (`inutNFe`/`retInutNFe` não
// fazem parte do pacote núcleo em specs/002-fiscal-api/contracts/NFe/, mesma
// decisão do usuário de prosseguir best-effort). Diferente de
// `NFeRecepcaoEvento4`, `NFeInutilizacao4` não usa envelope de lote — é uma
// troca direta `inutNFe`/`retInutNFe`, sem `idLote`.
// ---------------------------------------------------------------------------

export type BuildInutNfeXmlInput = {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  /// Código IBGE da UF do emitente (2 dígitos) — ex.: "29" para Bahia (mesmo
  /// campo usado em `nfe-xml.builder.ts`, `cUF = cityCodeIbge.slice(0, 2)`).
  cUF: string;
  cnpj: string;
  series: string;
  numberStart: string;
  numberEnd: string;
  justification: string;
  requestDateTime: Date;
  /// ⚠️ Modelo da numeração a inutilizar: `55` (NF-e) ou `65` (NFC-e).
  ///
  /// **Não tem valor padrão de propósito.** NF-e e NFC-e têm numerações
  /// **separadas**, e o modelo aparece em DOIS lugares aqui — o `Id` do
  /// `infInut` e o elemento `<mod>`. Um padrão silencioso faria a inutilização
  /// de uma faixa de cupom queimar a faixa equivalente de NF-e junto ao fisco,
  /// deixando a lacuna real do cupom ainda em aberto. Nenhum dos dois lados é
  /// reversível por código.
  model: '55' | '65';
};

/// Monta o `<inutNFe>` (ainda não assinado — quem chama assina com
/// `signXml`/perfil `NFE_SEFAZ`, referenciando `infInut` via `Id`, igual a
/// `infNFe`/`infEvento`).
export function buildInutNfeXml(input: BuildInutNfeXmlInput): {
  unsignedInutNfeXml: string;
  infInutId: string;
} {
  const ano = String(input.requestDateTime.getFullYear()).slice(-2);
  const mod = input.model;
  const infInutId =
    `ID${input.cUF.padStart(2, '0')}${ano}${input.cnpj.padStart(14, '0')}` +
    `${mod}${input.series.padStart(3, '0')}` +
    `${input.numberStart.padStart(9, '0')}${input.numberEnd.padStart(9, '0')}`;

  const infInut =
    `<infInut Id="${infInutId}">` +
    `<tpAmb>${toTpAmb(input.environment)}</tpAmb>` +
    `<xServ>INUTILIZAR</xServ>` +
    `<cUF>${input.cUF}</cUF>` +
    `<ano>${ano}</ano>` +
    `<CNPJ>${input.cnpj}</CNPJ>` +
    `<mod>${mod}</mod>` +
    `<serie>${input.series}</serie>` +
    `<nNFIni>${input.numberStart}</nNFIni>` +
    `<nNFFin>${input.numberEnd}</nNFFin>` +
    `<xJust>${escapeXmlText(input.justification)}</xJust>` +
    `</infInut>`;

  return {
    unsignedInutNfeXml: `<inutNFe xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSION}">${infInut}</inutNFe>`,
    infInutId,
  };
}

export type SefazInutilizeResult =
  | {
      /// cStat 102 ("Inutilização de número homologado") — o código de
      /// sucesso documentado de forma estável para este webservice.
      status: 'INUTILIZED';
      protocol: string;
      responseXml: string;
    }
  | { status: 'REJECTED'; errorCode: string; errorMessage: string };

/// Interpreta o `<retInutNFe>` (resposta de `nfeInutilizacaoNF`). Mesma
/// política de "falha fechado" das outras funções `parseRet*` deste arquivo.
export function parseRetInutNfeXml(
  retInutNfeXml: string,
): SefazInutilizeResult {
  const infInutXml = extractElementXml(retInutNfeXml, 'infInut');
  const cStat = infInutXml ? readElementText(infInutXml, 'cStat') : null;
  const xMotivo = infInutXml ? readElementText(infInutXml, 'xMotivo') : null;
  const nProt = infInutXml ? readElementText(infInutXml, 'nProt') : null;

  if (cStat === '102' && nProt) {
    return {
      status: 'INUTILIZED',
      protocol: nProt,
      responseXml: retInutNfeXml,
    };
  }

  return {
    status: 'REJECTED',
    errorCode: cStat ?? 'DESCONHECIDO',
    errorMessage: xMotivo || 'Inutilização rejeitada pela SEFAZ',
  };
}
