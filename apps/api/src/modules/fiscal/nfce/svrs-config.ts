import { join } from 'path';

/**
 * Roteamento de endpoints/WSDLs da SEFAZ-BA (NF-e) e SVRS (NFC-e). Portado de
 * @citybox/fiscal-api (sefaz-ba-config.ts). Mantém as sobrescritas por env var e
 * o default de homologação do SVRS.
 */

/** Endpoint da SEFAZ/SVRS não configurado para o ambiente pedido. */
export class SefazAmbienteNaoConfigurado extends Error {
  constructor(context: string, environment: string) {
    super(
      `Endpoint da SEFAZ não configurado para o ambiente "${environment}" (${context}). ` +
        'Configure a variável de ambiente correspondente.',
    );
    this.name = 'SefazAmbienteNaoConfigurado';
  }
}

/**
 * Caminhos dos WSDLs locais (autoria própria) e endpoints reais. Resolvidos via
 * `process.cwd()` (estável entre ts-jest e o build compilado). Sobrescrevíveis
 * via env var para deployments com layout diferente.
 */
export const NFE_AUTORIZACAO_WSDL_PATH =
  process.env.SEFAZ_BA_NFE_AUTORIZACAO_WSDL_PATH ??
  join(process.cwd(), 'resources/wsdl/nfe/NFeAutorizacao4.wsdl');

export const NFE_CONSULTA_PROTOCOLO_WSDL_PATH =
  process.env.SEFAZ_BA_NFE_CONSULTA_WSDL_PATH ??
  join(process.cwd(), 'resources/wsdl/nfe/NFeConsultaProtocolo4.wsdl');

/** Cancelamento/carta de correção — mesma ressalva de autoria própria. */
export const NFE_RECEPCAO_EVENTO_WSDL_PATH =
  process.env.SEFAZ_BA_NFE_RECEPCAO_EVENTO_WSDL_PATH ??
  join(process.cwd(), 'resources/wsdl/nfe/NFeRecepcaoEvento4.wsdl');

/** Inutilização — mesma ressalva de autoria própria. */
export const NFE_INUTILIZACAO_WSDL_PATH =
  process.env.SEFAZ_BA_NFE_INUTILIZACAO_WSDL_PATH ??
  join(process.cwd(), 'resources/wsdl/nfe/NFeInutilizacao4.wsdl');

/**
 * v1 opera em homologação — o endpoint de produção fica documentado aqui mas NÃO
 * configurado por padrão; habilitar produção é uma decisão explícita.
 */
const HOMOLOGATION_BASE_URL =
  process.env.SEFAZ_BA_NFE_HOMOLOGATION_ENDPOINT ??
  'https://hnfe.sefaz.ba.gov.br';

const PRODUCTION_BASE_URL = process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT;

export type SefazOperation =
  | 'NFeAutorizacao4'
  | 'NFeConsultaProtocolo4'
  | 'NFeRecepcaoEvento4'
  | 'NFeInutilizacao4'
  /**
   * Disponibilidade do serviço. Mesma operação para NF-e e NFC-e; muda só o
   * órgão de destino, roteado por modelo abaixo.
   */
  | 'NFeStatusServico4';

/**
 * ⚠️ **A Bahia NÃO autoriza NFC-e: ela delega ao SVRS.**
 *
 * Descoberto no E2E, depois de a SEFAZ-BA responder `Rejeição 702 — NFC-e não é
 * aceita pela UF do Emitente` a um modelo 65 enviado ao webservice de NF-e. O
 * *Manual de Configuração do Programa Emissor NFC-e* da SEFAZ-BA é explícito:
 * **"HOMOLOGAÇÃO NFC-e - SEFAZ VIRTUAL SVRS"**.
 *
 * O **certificado** é o mesmo; o **destino** não.
 *
 * O padrão de caminho também difere e **não é derivável** do da Bahia
 * (`/webservices/{op}/{op}.asmx`): o SVRS usa `/ws/`, com nomes de pasta e
 * arquivo que variam por operação — inclusive na caixa. Daí o mapa explícito,
 * copiado do manual em vez de gerado por regra.
 */
const SVRS_NFCE_PATHS: Record<SefazOperation, string> = {
  NFeAutorizacao4: 'ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  NFeConsultaProtocolo4: 'ws/NfeConsulta/NfeConsulta4.asmx',
  NFeRecepcaoEvento4: 'ws/recepcaoevento/recepcaoevento4.asmx',
  NFeInutilizacao4: 'ws/nfeinutilizacao/nfeinutilizacao4.asmx',
  /**
   * ⚠️ Caixa própria: pasta `NfeStatusServico` (f minúsculo), arquivo
   * `NFeStatusServico4.asmx` (F maiúsculo). Copiado literal da lista oficial do
   * portal DFe do SVRS, não derivado — o SVRS varia a caixa por operação.
   */
  NFeStatusServico4: 'ws/NfeStatusServico/NFeStatusServico4.asmx',
};

const SVRS_NFCE_HOMOLOGATION_BASE_URL =
  process.env.SVRS_NFCE_HOMOLOGATION_ENDPOINT ??
  'https://nfce-homologacao.svrs.rs.gov.br';

/** Sem valor padrão, como todo endpoint de produção deste serviço. */
const SVRS_NFCE_PRODUCTION_BASE_URL = process.env.SVRS_NFCE_PRODUCTION_ENDPOINT;

/** Modelo do documento: `55` = NF-e (autorizador da BA), `65` = NFC-e (SVRS). */
export type SefazFiscalModel = '55' | '65';

export function resolveSefazBaEndpoint(
  operation: SefazOperation,
  environment: 'HOMOLOGATION' | 'PRODUCTION',
  /**
   * @default '55' — preserva o comportamento da NF-e, que é o caminho já em
   * produção. Só a NFC-e precisa dizer o modelo.
   */
  model: SefazFiscalModel = '55',
): string {
  if (model === '65') {
    const baseUrl =
      environment === 'PRODUCTION'
        ? SVRS_NFCE_PRODUCTION_BASE_URL
        : SVRS_NFCE_HOMOLOGATION_BASE_URL;
    if (!baseUrl) {
      throw new SefazAmbienteNaoConfigurado(
        'resolveSefazBaEndpoint',
        environment,
      );
    }
    return `${baseUrl}/${SVRS_NFCE_PATHS[operation]}`;
  }

  const baseUrl =
    environment === 'PRODUCTION' ? PRODUCTION_BASE_URL : HOMOLOGATION_BASE_URL;
  if (!baseUrl) {
    throw new SefazAmbienteNaoConfigurado(
      'resolveSefazBaEndpoint',
      environment,
    );
  }
  return `${baseUrl}/webservices/${operation}/${operation}.asmx`;
}
