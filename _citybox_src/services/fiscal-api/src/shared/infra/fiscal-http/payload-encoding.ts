import { gzipSync, gunzipSync } from 'zlib';
import { EmptyDpsPayloadError } from './errors/empty-dps-payload.error';

/// Codificação da área de dados exigida pelo Sistema Nacional da NFS-e.
///
/// O schema `NFSePostRequest` do OpenAPI oficial define um único campo
/// obrigatório — `dpsXmlGZipB64`, "DPS compactado no padrão gZip
/// (base64Binary)". O corpo da requisição é **JSON**, não XML nem multipart.
///
/// As regras de recepção do Anexo I rejeitam cada etapa separadamente
/// (`E1225` base64, `E1226` descompactação, `E1229` UTF-8), então errar aqui
/// derruba 100% dos envios — nunca de forma intermitente.

export function encodeDpsPayload(signedDpsXml: string): string {
  if (!signedDpsXml.trim()) {
    throw new EmptyDpsPayloadError('encodeDpsPayload');
  }
  // `utf-8` explícito: o padrão do Node já é esse, mas `E1229` rejeita XML
  // fora de UTF-8 e deixar implícito convida alguém a "otimizar" para latin1.
  return gzipSync(Buffer.from(signedDpsXml, 'utf-8')).toString('base64');
}

/// Só usado em teste e diagnóstico — o ambiente nacional nunca nos devolve a
/// DPS nesse formato. Existe para o round-trip ser verificável.
export function decodeDpsPayload(dpsXmlGZipB64: string): string {
  return gunzipSync(Buffer.from(dpsXmlGZipB64, 'base64')).toString('utf-8');
}

/// ⚠️ **Nome do campo NÃO VERIFICADO.**
///
/// `dpsXmlGZipB64` (acima) veio do schema `NFSePostRequest` do OpenAPI oficial,
/// lido com certificado A1 em 2026-08-06. O equivalente para o **evento** não
/// foi possível confirmar: o OpenAPI deixou de responder nos caminhos
/// conhecidos (404 em `/SefinNacional/swagger/v1/swagger.json`), e um POST de
/// sondagem com corpo vazio em homologação devolveu `HTTP 500` genérico, sem
/// nomear campo obrigatório.
///
/// O default abaixo segue a convenção do campo irmão, mas é **suposição**.
/// Sobrescrevível por env justamente para poder ser corrigido sem alterar
/// código, assim que o Manual de Orientação ao Contribuinte (indisponível neste
/// ambiente) ou o OpenAPI confirmarem o nome real.
export const SEFIN_EVENT_PAYLOAD_FIELD =
  process.env.SEFIN_EVENT_PAYLOAD_FIELD ?? 'pedidoRegistroEventoXmlGZipB64';

/// Mesma codificação da DPS (gzip + base64) — essa parte É verificada: as
/// regras de recepção do Anexo I (`E1225`/`E1226`/`E1229`) valem para toda área
/// de dados do Sistema Nacional, não só para a DPS.
export function encodeEventPayload(
  signedEventXml: string,
): Record<string, string> {
  if (!signedEventXml.trim()) {
    throw new EmptyDpsPayloadError('encodeEventPayload');
  }
  return {
    [SEFIN_EVENT_PAYLOAD_FIELD]: gzipSync(
      Buffer.from(signedEventXml, 'utf-8'),
    ).toString('base64'),
  };
}
