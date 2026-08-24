import { buildXml } from '../../../../shared/infra/fiscal-xml/xml-builder';
import { NFSE_LEIAUTE_VERSION } from './nfse-leiaute-version';

/// Códigos oficiais dos dois eventos cobertos aqui (`tiposEventos_v1.01.xsd`).
/// Compõem o `Id` do pedido e escolhem o elemento do leiaute — por isso ficam
/// juntos do resto da montagem, não em um enum distante.
const EVENT_TYPE_CODE = {
  CANCEL: '101101',
  FISCAL_ANALYSIS: '101103',
  SUBSTITUTION: '105102',
} as const;

/// `xDesc` é enumeração fechada no XSD: qualquer outro texto é rejeitado por
/// schema. Literal, não derivado.
const EVENT_DESCRIPTION = {
  CANCEL: 'Cancelamento de NFS-e',
  FISCAL_ANALYSIS: 'Solicitação de Análise Fiscal para Cancelamento de NFS-e',
  SUBSTITUTION: 'Cancelamento de NFS-e por Substituição',
} as const;

/// `TSMotivo`: 15–255 caracteres. Validado aqui para o operador receber um erro
/// legível em vez de uma rejeição do órgão fiscal por schema.
const REASON_MIN_LENGTH = 15;
const REASON_MAX_LENGTH = 255;

export type EventoKind = keyof typeof EVENT_TYPE_CODE;

/// `TSCodJustCanc` (e101101/e101103): 1 = erro na emissão, 2 = serviço não
/// prestado, 9 = outros.
export type CancelReasonCode = '1' | '2' | '9';

/// `TSCodJustSubst` (e105102) — lista PRÓPRIA, de dois dígitos, sem interseção
/// com `TSCodJustCanc`: 01 desenquadramento do Simples, 02 enquadramento,
/// 03/04 inclusão/exclusão retroativa de imunidade ou isenção, 05 rejeição
/// pelo tomador ou intermediário, 99 outros.
export type SubstitutionReasonCode = '01' | '02' | '03' | '04' | '05' | '99';

export type EventoXmlInput = {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  kind: EventoKind;
  /// Autor do evento — o prestador. Procurador não é autor (XSD `TCInfPedReg`).
  authorAtDocument: { documentType: 'CPF' | 'CNPJ'; document: string };
  /// Chave de acesso da NFS-e (50 dígitos), não o `Id` da DPS.
  nfseAccessKey: string;
  reasonCode: CancelReasonCode | SubstitutionReasonCode;
  /// `TSMotivo` (15–255). Obrigatório em `e101101`/`e101103`; **opcional** em
  /// `e105102`, onde a chave da substituta já diz o que aconteceu.
  reasonText?: string;
  /// Chave da NFS-e que assume o lugar (`chSubstituta`). Só em `SUBSTITUTION`,
  /// onde é obrigatória.
  substituteAccessKey?: string;
  /// `verAplic` — versao do aplicativo emissor. `TSVerAplic` limita a 20
  /// caracteres; o default cabe com folga.
  applicationVersion?: string;
  /// Injetável para o teste; produção usa o relógio.
  now?: Date;
};

export type EventoXmlResult = {
  /// `Buffer`, como em `dps-xml.builder.ts` — quem assina consome `.toString()`.
  xml: Buffer;
  /// `Id` do `infPedReg`, necessário para assinar o XML no XPath certo.
  eventId: string;
};

/// Monta o Pedido de Registro de Evento (`pedRegEvento_v1.01.xsd`) para
/// cancelamento direto ou solicitação de análise fiscal.
///
/// Não assina: a assinatura é aplicada por `signXml` sobre `infPedReg`, mesmo
/// arranjo usado na DPS — montar e assinar são responsabilidades separadas
/// porque só a segunda precisa do material do certificado.
export function buildEventoXml(input: EventoXmlInput): EventoXmlResult {
  const isSubstitution = input.kind === 'SUBSTITUTION';
  const reasonText = input.reasonText?.trim() ?? '';

  // `xMotivo` é obrigatório nos eventos de cancelamento e opcional na
  // substituição — quando informado, o limite vale nos dois casos.
  const requiresReasonText = !isSubstitution;
  if (requiresReasonText || reasonText) {
    if (
      reasonText.length < REASON_MIN_LENGTH ||
      reasonText.length > REASON_MAX_LENGTH
    ) {
      throw new Error(
        `Motivo do evento deve ter entre ${REASON_MIN_LENGTH} e ${REASON_MAX_LENGTH} caracteres (recebido: ${reasonText.length})`,
      );
    }
  }

  const substituteAccessKey = isSubstitution
    ? (input.substituteAccessKey?.replace(/\D/g, '') ?? '')
    : '';
  if (isSubstitution && !substituteAccessKey) {
    throw new Error(
      'Evento de substituição exige a chave de acesso da NFS-e substituta (chSubstituta)',
    );
  }

  const accessKey = input.nfseAccessKey.replace(/\D/g, '');
  const eventTypeCode = EVENT_TYPE_CODE[input.kind];
  // `TSIdPedRegEvt` impoe `PRE[0-9]{56}` (maxLength 59). A anotacao do XSD
  // descreve a composicao como chave + tipo do evento + nPedRegEvento, o que
  // daria 50+6+3 = 59 digitos e NAO cabe no padrao. Chave(50) + tipo(6) = 56
  // fecha exatamente, e o padrao e o que o parser aplica — divergencia da
  // documentacao contra si mesma, resolvida a favor do que e verificavel.
  // (Compare `TSIdEvento`, id atribuido pelo orgao: EVT + 50 + 6 + 3 = 62,
  // consistente com sua maxLength. So o id do PEDIDO diverge.)
  const eventId = `PRE${accessKey}${eventTypeCode}`;

  // Ordem dos elementos importa: o XSD usa `xs:sequence`, não `xs:all`.
  const eventBody = {
    xDesc: EVENT_DESCRIPTION[input.kind],
    cMotivo: input.reasonCode,
    ...(reasonText ? { xMotivo: reasonText } : {}),
    ...(isSubstitution ? { chSubstituta: substituteAccessKey } : {}),
  };

  const pedRegEvento = {
    pedRegEvento: {
      '@xmlns': 'http://www.sped.fazenda.gov.br/nfse',
      '@versao': NFSE_LEIAUTE_VERSION,
      infPedReg: {
        '@Id': eventId,
        tpAmb: input.environment === 'PRODUCTION' ? '1' : '2',
        verAplic: input.applicationVersion ?? 'citybox-fiscal-1.0',
        dhEvento: toSaoPauloOffsetDateTime(input.now ?? new Date()),
        [input.authorAtDocument.documentType === 'CNPJ'
          ? 'CNPJAutor'
          : 'CPFAutor']: input.authorAtDocument.document.replace(/\D/g, ''),
        chNFSe: accessKey,
        [`e${eventTypeCode}`]: eventBody,
      },
    },
  };

  return { xml: buildXml(pedRegEvento), eventId };
}

/// `TSDateTimeUTC` exige offset explícito (`-03:00`), nunca `Z`, e sem
/// milissegundos — mesma regra já aplicada na NF-e (`nfe-xml.builder.ts`).
function toSaoPauloOffsetDateTime(date: Date): string {
  const OFFSET_MINUTES = -180;
  const shifted = new Date(date.getTime() + OFFSET_MINUTES * 60_000);
  return `${shifted.toISOString().slice(0, 19)}-03:00`;
}
