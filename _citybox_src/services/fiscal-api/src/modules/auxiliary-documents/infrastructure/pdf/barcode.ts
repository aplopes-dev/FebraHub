import { toBuffer as bwipToBuffer } from 'bwip-js';
import { toBuffer as qrToBuffer } from 'qrcode';

/// Códigos de barras e QR dos documentos auxiliares (FR-004).
///
/// Módulo separado do renderizador porque a codificação da chave de acesso é
/// regulada e independente do leiaute: o mesmo CODE-128C serve DANFE e DANFSE,
/// e testá-lo isoladamente é mais barato do que inferir sua correção a partir
/// de um PDF inteiro.

/// Altura em pontos. O leiaute reserva uma faixa estreita para o código, e
/// altura demais empurra o quadro seguinte.
const BARCODE_HEIGHT = 12;
const BARCODE_SCALE = 3;

/// ⚠️ **Os dois documentos usam comprimentos diferentes de chave**, e tratar os
/// dois como 44 dígitos quebra o DANFSE:
///
/// | Documento | Chave | Origem |
/// | --- | --- | --- |
/// | NF-e (DANFE) | **44** dígitos | SEFAZ |
/// | NFS-e (DANFSE) | **50** dígitos | Padrão Nacional |
///
/// Ambos usam **CODE-128C**, que codifica pares de dígitos e por isso ocupa
/// metade da largura do CODE-128B. Não é otimização: em 128B nenhuma das duas
/// caberia na faixa prevista pelo leiaute — e 128C **exige** contagem par de
/// dígitos, o que as duas satisfazem.
const NFE_ACCESS_KEY_LENGTH = 44;
const NFSE_ACCESS_KEY_LENGTH = 50;
const VALID_ACCESS_KEY_LENGTHS: readonly number[] = [
  NFE_ACCESS_KEY_LENGTH,
  NFSE_ACCESS_KEY_LENGTH,
];

export async function renderAccessKeyBarcode(
  accessKey: string,
): Promise<Buffer> {
  const digits = accessKey.replace(/\D/g, '');

  if (!VALID_ACCESS_KEY_LENGTHS.includes(digits.length)) {
    // Falhar aqui, e não desenhar um código truncado: um código de barras
    // ilegível num documento fiscal é pior que a ausência dele, porque parece
    // válido até alguém tentar ler.
    throw new Error(
      `Chave de acesso deve ter ${NFE_ACCESS_KEY_LENGTH} digitos (NF-e) ou ${NFSE_ACCESS_KEY_LENGTH} (NFS-e) para o CODE-128C; recebida com ${digits.length}.`,
    );
  }

  return bwipToBuffer({
    bcid: 'code128',
    text: digits,
    // Força o subconjunto C — sem isto a biblioteca escolhe o encoding e pode
    // cair em 128B, dobrando a largura.
    parsefnc: false,
    height: BARCODE_HEIGHT,
    scale: BARCODE_SCALE,
    includetext: false,
    backgroundcolor: 'FFFFFF',
  });
}

/// QR Code do DANFSE. O Padrão Nacional publica uma URL de consulta pública
/// por chave de acesso; o QR carrega essa URL para que o tomador confira a
/// nota sem digitar 44 dígitos.
export async function renderVerificationQrCode(url: string): Promise<Buffer> {
  return qrToBuffer(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 4,
    type: 'png',
  });
}

/// Formatação legível da chave (FR-004 exige as duas formas: código de barras
/// **e** legível). Grupos de 4 é a convenção dos dois leiautes — sem eles,
/// conferir 44 dígitos a olho é inviável.
export function formatAccessKey(accessKey: string): string {
  return (accessKey.replace(/\D/g, '').match(/.{1,4}/g) ?? []).join(' ');
}
