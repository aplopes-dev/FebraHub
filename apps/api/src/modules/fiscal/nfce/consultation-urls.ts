/**
 * URLs de consulta pública da NFC-e, por UF e ambiente. Portado de
 * @citybox/fiscal-api (consultation-urls.ts). Mantém `assertUsable` com o limite
 * de 85 caracteres do `urlChave`.
 */

export type NfceUrls = {
  /** Base do QR Code (`infNFeSupl/qrCode`). */
  qrCode: string;
  /**
   * "Consulta por chave de acesso" (`infNFeSupl/urlChave`). ⚠️ É **outra** URL,
   * não a do QR Code — o XSD define os dois elementos separadamente, e esta
   * precisa aparecer impressa no cupom para consulta manual.
   */
  accessKeyLookup: string;
};

/**
 * Limites do XSD para `infNFeSupl` (`leiauteNFe_v4.00.xsd`).
 *
 * ⚠️ **`urlChave` cabe em 85 caracteres, e isso é apertado.** O caminho completo
 * de "consulta por chave de acesso" da SEFAZ-BA
 * (`.../servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx`) tem 88 e
 * **não cabe**. O órgão publica uma forma curta para este campo; usar o caminho
 * longo produz XML reprovado por schema.
 */
const URL_CHAVE_MIN = 21;
const URL_CHAVE_MAX = 85;

/**
 * O `qrCode` inteiro (URL + parâmetros + hash) tem de caber em 1000. A parte fixa
 * aqui é só a base; sobra folga larga, mas um valor absurdo indicaria
 * configuração trocada.
 */
const QR_BASE_MAX = 600;

/**
 * URL de consulta ausente **ou inválida** para a UF/ambiente. Não é dado
 * inválido do pedido, é configuração de ambiente que falta.
 */
export class NfceConsultationUrlNaoConfigurada extends Error {
  readonly uf: string;
  readonly environment: string;
  constructor(
    context: string,
    uf: string,
    environment: string,
    reason = 'não configuradas',
  ) {
    super(
      `Emissão de cupom fiscal não configurada para ${uf.toUpperCase()} em ${environment}: ${reason}. ` +
        `Ajuste as URLs de consulta da SEFAZ (${context}).`,
    );
    this.name = 'NfceConsultationUrlNaoConfigurada';
    this.uf = uf;
    this.environment = environment;
  }
}

/**
 * Valida contra os limites do XSD **na leitura da configuração**.
 *
 * ⚠️ **Por que aqui e não na montagem do XML.** A validação de schema acontece
 * depois de a numeração ser reservada — o XML não existe antes do número. Uma
 * `urlChave` de 88 caracteres produziria erro de validação **com o número já
 * queimado**. Lido aqui, o mesmo defeito falha **antes** de numerar.
 */
function assertUsable(
  uf: string,
  environment: string,
  urls: NfceUrls,
): NfceUrls {
  const fail = (reason: string): never => {
    throw new NfceConsultationUrlNaoConfigurada(
      'NfceConsultationUrls',
      uf,
      environment,
      reason,
    );
  };

  const { length } = urls.accessKeyLookup;
  if (length < URL_CHAVE_MIN || length > URL_CHAVE_MAX) {
    fail(
      `urlChave tem ${length} caracteres e o schema exige entre ${URL_CHAVE_MIN} e ${URL_CHAVE_MAX} ` +
        `(a SEFAZ publica uma forma curta para este campo — o caminho completo da página de consulta não cabe)`,
    );
  }

  if (urls.qrCode.length > QR_BASE_MAX) {
    fail(
      `URL base do QR Code tem ${urls.qrCode.length} caracteres, além do razoável`,
    );
  }

  for (const [nome, valor] of [
    ['qrCode', urls.qrCode],
    ['urlChave', urls.accessKeyLookup],
  ] as const) {
    if (!/^https?:\/\//i.test(valor)) {
      fail(`${nome} precisa começar com http:// ou https://`);
    }
  }

  return urls;
}

/**
 * URLs de consulta pública da NFC-e, por UF e ambiente.
 *
 * ⚠️ **Sem valor padrão, deliberadamente.** As URLs são estaduais, e apontar
 * para o estado errado produz exatamente a falha que esta feature tenta evitar:
 * cupom autorizado, impresso, com QR Code que leva a lugar nenhum.
 */
export abstract class NfceConsultationUrls {
  abstract forUf(
    uf: string,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): NfceUrls;
}

/**
 * Resolve por variáveis de ambiente, no padrão `NFCE_QRCODE_URL_<UF>_<AMBIENTE>`
 * e `NFCE_CHAVE_URL_<UF>_<AMBIENTE>`.
 *
 * Por ambiente, e não só por UF, porque homologação e produção são hosts
 * distintos — usar o de produção em homologação geraria QR Code que a consulta
 * oficial não reconhece.
 */
export class EnvNfceConsultationUrls extends NfceConsultationUrls {
  forUf(uf: string, environment: 'HOMOLOGATION' | 'PRODUCTION'): NfceUrls {
    const suffix = `${uf.trim().toUpperCase()}_${environment}`;
    const qrCode = process.env[`NFCE_QRCODE_URL_${suffix}`]?.trim();
    const accessKeyLookup = process.env[`NFCE_CHAVE_URL_${suffix}`]?.trim();

    if (!qrCode || !accessKeyLookup) {
      throw new NfceConsultationUrlNaoConfigurada(
        EnvNfceConsultationUrls.name,
        uf,
        environment,
      );
    }

    // Validado na leitura, não na montagem: ver `assertUsable`.
    return assertUsable(uf, environment, { qrCode, accessKeyLookup });
  }
}
