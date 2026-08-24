import { gunzipSync } from 'zlib';
import { encodeDpsPayload, decodeDpsPayload } from '../payload-encoding';

/// Formato confirmado no schema `NFSePostRequest` do OpenAPI oficial do SEFIN
/// Nacional (lido em 2026-08-06 com certificado de cliente):
/// `dpsXmlGZipB64` — "DPS compactado no padrão gZip (base64Binary)".
///
/// Errar isto significa rejeição em 100% dos envios (`E1225`/`E1226`), nunca
/// intermitente — daí valer teste de ida e volta contra o `zlib` real.
describe('payload-encoding (dpsXmlGZipB64)', () => {
  const dps =
    '<?xml version="1.0" encoding="UTF-8"?><DPS xmlns="http://www.sped.fazenda.gov.br/nfse"><infDPS Id="DPS123"/></DPS>';

  it('produces base64 of gzip, decodable back to the original XML', () => {
    const encoded = encodeDpsPayload(dps);

    // base64 puro — nenhum caractere fora do alfabeto.
    expect(encoded).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

    const gzipped = Buffer.from(encoded, 'base64');
    // Assinatura do gzip: 0x1f 0x8b. Deflate cru não a tem — é o que
    // distingue os dois formatos, e a distinção é a diferença entre a nota
    // ser aceita ou rejeitada.
    expect(gzipped[0]).toBe(0x1f);
    expect(gzipped[1]).toBe(0x8b);
    expect(gunzipSync(gzipped).toString('utf-8')).toBe(dps);
  });

  it('round-trips through the module’s own decoder', () => {
    expect(decodeDpsPayload(encodeDpsPayload(dps))).toBe(dps);
  });

  it('handles accented content without corrupting it (UTF-8)', () => {
    // `E1229` rejeita XML que não esteja em UTF-8 — acento é o caso trivial
    // que quebra se alguém trocar a codificação por latin1.
    const comAcento = '<DPS><xNome>SERVIÇOS DE MANUTENÇÃO</xNome></DPS>';

    expect(decodeDpsPayload(encodeDpsPayload(comAcento))).toBe(comAcento);
  });

  it('rejects empty content instead of sending an empty payload', () => {
    expect(() => encodeDpsPayload('   ')).toThrow();
  });
});
