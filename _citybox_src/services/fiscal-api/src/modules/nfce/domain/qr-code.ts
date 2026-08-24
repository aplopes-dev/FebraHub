import { createHash } from 'crypto';
import { CompanyCscNotConfiguredError } from '../../companies/domain/errors/company-csc-not-configured.error';

/// Versão do QR Code da NFC-e. `2` é a vigente desde a NT 2015.002 v1.50 — a
/// versão 1, bem mais verbosa, saiu de uso. O valor vai literal no conteúdo e é
/// o que diz à SEFAZ como interpretar os campos seguintes.
export const QR_CODE_VERSION = '2';

/// ⚠️ ESTE ARQUIVO É O PONTO DE MAIOR RISCO DA FEATURE.
///
/// O QR Code é o único elo entre o papel na mão do consumidor e a nota na base
/// do fisco. Se o conteúdo sair errado, **nada** falha no caminho da emissão: a
/// SEFAZ autoriza o cupom, a API devolve 201, o PDF imprime bonito, e a falha
/// só aparece quando alguém aponta o celular e a consulta não acha nada — dias
/// depois, com cupons já entregues.
///
/// Por isso o cálculo mora aqui, isolado, puro e sem I/O: é a única forma de
/// tê-lo sob teste direto.
///
/// **O que a suíte prova e o que não prova**: os testes travam a composição
/// (campos, ordem, separador, cobertura do hash). Eles NÃO provam que o
/// algoritmo confere com o do órgão — isso não se prova sem o órgão. A prova é
/// o Cenário 2 do quickstart, escaneando um cupom real de homologação contra a
/// consulta pública da SEFAZ-BA. Até que isso seja feito uma vez, suíte verde
/// aqui não autoriza produção.

export type QrCodeEnvironment = 'HOMOLOGATION' | 'PRODUCTION';

/// Dados extras exigidos apenas na emissão em contingência offline.
///
/// Existem porque nesse caso a SEFAZ **ainda não tem o cupom**: a consulta
/// precisa conferir os valores a partir do próprio QR Code, e não da base.
///
/// ⚠️ O conjunto de campos veio do **XSD oficial**, não de documentação em
/// prosa — ver `assertMatchesOfficialPattern` na suíte. A primeira versão
/// deste arquivo trazia `dhEmi` inteiro em hexadecimal e um `vICMS`, herdados
/// da V1 do QR Code; a V2 não tem nenhum dos dois.
export type OfflineQrCodeData = {
  /// Data de emissão. Do QR Code V2 entra **apenas o dia** (`01`-`31`) — o
  /// padrão do XSD é `([0]{1}[1-9]{1}|[1-2]{1}[0-9]{1}|[3]{1}[0-1]{1})`.
  emittedAt: Date;
  totalAmount: number;
  /// `DigestValue` da assinatura, em base64 como aparece no XML. Vai
  /// hexadecimalizado: 28 caracteres base64 (SHA-1) viram os 56 hex que o XSD
  /// exige. Por isso o QR Code de contingência **só pode ser calculado depois
  /// de assinar** — ver research.md R2.
  digestValue: string;
};

export type BuildNfceQrCodeInput = {
  accessKey: string;
  environment: QrCodeEnvironment;
  /// `cIdToken`. Aceita a forma que a SEFAZ mostra no portal (`000001`) e
  /// normaliza: o XSD **proíbe zeros à esquerda**
  /// (`(0|[1-9]{1}([0-9]{1,5})?)`), então `000001` reprovaria por schema.
  cscId: string;
  cscToken: string;
  /// URL de consulta pública, que varia **por UF**. Não tem valor padrão de
  /// propósito: chutar a URL de outro estado produziria o mesmo tipo de falha
  /// silenciosa que este módulo existe para evitar.
  consultationUrl: string;
  offline?: OfflineQrCodeData;
};

const TP_AMB: Record<QrCodeEnvironment, string> = {
  PRODUCTION: '1',
  HOMOLOGATION: '2',
};

const FIELD_SEPARATOR = '|';

/// Hexadecimaliza o `DigestValue`. O XSD pede `[A-Fa-f0-9]{56}`, e é isso que
/// 28 caracteres base64 produzem.
function toHex(value: string): string {
  return Buffer.from(value, 'utf8').toString('hex');
}

function toAmount(value: number): string {
  return value.toFixed(2);
}

/// Zeros à esquerda reprovariam por schema. `000001` → `1`; `000000` → `0`.
function toCIdToken(cscId: string): string {
  return cscId.trim().replace(/^0+/, '') || '0';
}

/// Monta o conteúdo **textual** do QR Code — não a imagem.
///
/// A distinção importa: é este texto que vai para `infNFeSupl` no XML, e a
/// imagem impressa no cupom é derivada dele. Gerar a imagem sem gravar o texto
/// no XML produz cupom impresso e inconsultável.
export function buildNfceQrCode(input: BuildNfceQrCodeInput): {
  qrCode: string;
  consultationUrl: string;
} {
  if (!input.cscId.trim() || !input.cscToken.trim()) {
    // Última linha de defesa. O caminho normal já recusou em `readCompanyCsc`
    // e antes disso em `hasCsc()`; esta guarda existe porque a função é pura e
    // pública, e um chamador futuro pode alcançá-la por outro caminho.
    throw new CompanyCscNotConfiguredError('buildNfceQrCode');
  }

  // ⚠️ A ordem deste array É o formato, e ele veio do XSD (padrões "QRCODE V2
  // ONLINE" e "QRCODE V2 OFFLINE" em `leiauteNFe_v4.00.xsd`). Reordenar quebra
  // a conferência do órgão sem quebrar nada aqui.
  const fields = [
    input.accessKey,
    QR_CODE_VERSION,
    TP_AMB[input.environment],
    ...(input.offline
      ? [
          String(input.offline.emittedAt.getDate()).padStart(2, '0'),
          toAmount(input.offline.totalAmount),
          toHex(input.offline.digestValue),
        ]
      : []),
    toCIdToken(input.cscId),
  ];

  const hashedPart = fields.join(FIELD_SEPARATOR);

  // O CSC entra no hash e NÃO entra no conteúdo: é segredo, e o QR Code é
  // impresso em papel. Concatenação direta, sem separador — o separador aqui
  // mudaria o digest.
  const hash = createHash('sha1')
    .update(`${hashedPart}${input.cscToken}`, 'utf8')
    .digest('hex')
    .toUpperCase();

  return {
    qrCode: `${input.consultationUrl}?p=${hashedPart}${FIELD_SEPARATOR}${hash}`,
    consultationUrl: input.consultationUrl,
  };
}
