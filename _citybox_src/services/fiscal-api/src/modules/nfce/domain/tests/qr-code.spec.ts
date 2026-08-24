import { createHash } from 'crypto';
import { buildNfceQrCode, QR_CODE_VERSION } from '../qr-code';
import { CompanyCscNotConfiguredError } from '../../../companies/domain/errors/company-csc-not-configured.error';

/// ⚠️ Sobre o que estes testes provam — e o que NÃO provam.
///
/// A **forma** do conteúdo é verificada contra os padrões do XSD oficial
/// (`resources/xsd/nfe/leiauteNFe_v4.00.xsd`, elemento `infNFeSupl/qrCode`),
/// copiados literalmente para as constantes abaixo. Isso é autoridade de
/// verdade, não prosa interpretada: um QR Code que não casa com esses regex é
/// rejeitado por schema antes mesmo de chegar à SEFAZ.
///
/// O que os padrões NÃO cobrem é o **hash**: para o XSD ele é só 40 dígitos
/// hexadecimais, então um SHA-1 do texto errado passaria aqui. Essa parte só é
/// provada de fora — Cenário 2 do quickstart, escaneando um cupom real de
/// homologação e vendo a consulta pública da SEFAZ-BA exibir ESTE cupom.
/// Enquanto isso não for feito uma vez contra o órgão, suíte verde aqui não
/// autoriza produção.

/// Copiados **literalmente** do XSD, com `&amp;` desescapado. Não reescrever
/// "para ficar legível": o valor destas constantes está em serem idênticas à
/// fonte, e qualquer simplificação afrouxaria a verificação em silêncio.
const XSD_V2_ONLINE =
  /^((HTTPS?|https?):\/\/.*\?p=([0-9]{6}[0-9A-Z]{12}[0-9]{16}(1|3|4)[0-9]{9})\|[2]\|[1-2]\|(0|[1-9]{1}([0-9]{1,5})?)\|[A-Fa-f0-9]{40})$/;

const XSD_V2_OFFLINE =
  /^((HTTPS?|https?):\/\/.*\?p=([0-9]{6}[0-9A-Z]{12}[0-9]{16}9[0-9]{9})\|[2]\|[1-2]\|([0]{1}[1-9]{1}|[1-2]{1}[0-9]{1}|[3]{1}[0-1]{1})\|(0|0\.[0-9]{2}|[1-9]{1}[0-9]{0,12}(\.[0-9]{2})?)\|[A-Fa-f0-9]{56}\|(0|[1-9]{1}([0-9]{1,5})?)\|[A-Fa-f0-9]{40})$/;
/// Chave com `tpEmis=1` (35º dígito) — emissão normal. O XSD exige `1|3|4`
/// aqui no padrão online e `9` no de contingência, então os dois casos usam
/// chaves diferentes.
const CHAVE = '29260811444777000161650010000000011100000015';
const CHAVE_CONTINGENCIA = '29260811444777000161650010000000019000000015';
/// Como a SEFAZ mostra no portal: com zeros à esquerda. O XSD os proíbe, então
/// o builder tem de normalizar — é o que o teste de `cIdToken` cobra.
const CSC_ID = '000001';
const CSC_ID_NORMALIZADO = '1';
const CSC_TOKEN = 'CSC-DE-TESTE-NAO-E-SEGREDO-REAL';
const URL_BA = 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx';

/// SHA-1 recalculado aqui de forma independente da implementação: o teste
/// monta a string esperada campo a campo e só então aplica o hash. Se
/// `qr-code.ts` mudar a ordem dos campos, os dois divergem.
function sha1Hex(value: string): string {
  return createHash('sha1').update(value, 'utf8').digest('hex').toUpperCase();
}

describe('buildNfceQrCode', () => {
  const base = {
    accessKey: CHAVE,
    environment: 'HOMOLOGATION' as const,
    cscId: CSC_ID,
    cscToken: CSC_TOKEN,
    consultationUrl: URL_BA,
  };

  it('monta o conteudo online com chave|versao|ambiente|idCsc|hash', () => {
    const { qrCode } = buildNfceQrCode(base);

    const [url, query] = qrCode.split('?');
    expect(url).toBe(URL_BA);

    const params = query.replace(/^p=/, '').split('|');
    expect(params).toHaveLength(5);
    expect(params[0]).toBe(CHAVE);
    expect(params[1]).toBe(QR_CODE_VERSION);
    expect(params[2]).toBe('2'); // homologação
    expect(params[3]).toBe(CSC_ID_NORMALIZADO);
  });

  it('o hash cobre EXATAMENTE o trecho anterior a ele, mais o CSC', () => {
    const { qrCode } = buildNfceQrCode(base);
    const params = qrCode.split('?p=')[1].split('|');
    const hash = params.pop();

    // Se a implementação incluir o hash no próprio trecho hasheado, ou
    // esquecer de concatenar o CSC, esta asserção quebra.
    expect(hash).toBe(sha1Hex(`${params.join('|')}${CSC_TOKEN}`));
  });

  it('usa tpAmb=1 em producao e tpAmb=2 em homologacao', () => {
    const homolog = buildNfceQrCode(base).qrCode.split('|')[2];
    const producao = buildNfceQrCode({
      ...base,
      environment: 'PRODUCTION',
    }).qrCode.split('|')[2];

    expect(homolog).toBe('2');
    expect(producao).toBe('1');
  });

  it('casa com o padrao V2 ONLINE do XSD oficial', () => {
    expect(buildNfceQrCode(base).qrCode).toMatch(XSD_V2_ONLINE);
  });

  it('normaliza o cIdToken: o XSD proibe zeros a esquerda', () => {
    // `000001` vindo do portal da SEFAZ reprovaria por schema. Rejeitar o
    // cadastro seria hostil; normalizar aqui é o comportamento certo.
    const params = buildNfceQrCode(base).qrCode.split('?p=')[1].split('|');
    expect(params[3]).toBe('1');
    expect(buildNfceQrCode({ ...base, cscId: '000000' }).qrCode).toMatch(
      XSD_V2_ONLINE,
    );
  });

  it('na contingencia leva dia, vNF e digVal — sem vICMS e sem dhEmi inteiro', () => {
    const { qrCode } = buildNfceQrCode({
      ...base,
      accessKey: CHAVE_CONTINGENCIA,
      offline: {
        emittedAt: new Date('2026-08-09T10:30:00-03:00'),
        totalAmount: 85,
        // 28 caracteres base64 = digest SHA-1, que vira os 56 hex do XSD.
        digestValue: 'kM3Yb1Qw9ZpLxT7RfNvAe2Hs4Uc=',
      },
    });

    // ⚠️ Oito campos, não nove. A primeira versão deste módulo trazia `dhEmi`
    // hexadecimalizado inteiro e um `vICMS` — ambos são da V1 do QR Code, que
    // saiu de uso. O XSD é quem desmentiu.
    const params = qrCode.split('?p=')[1].split('|');
    expect(params).toHaveLength(8);
    expect(params[3]).toBe('09'); // só o DIA da emissão
    expect(params[4]).toBe('85.00');
    expect(params[5]).toHaveLength(56);
    expect(params[6]).toBe(CSC_ID_NORMALIZADO);
  });

  it('casa com o padrao V2 OFFLINE do XSD oficial', () => {
    const { qrCode } = buildNfceQrCode({
      ...base,
      accessKey: CHAVE_CONTINGENCIA,
      offline: {
        emittedAt: new Date('2026-08-09T10:30:00-03:00'),
        totalAmount: 85,
        digestValue: 'kM3Yb1Qw9ZpLxT7RfNvAe2Hs4Uc=',
      },
    });

    expect(qrCode).toMatch(XSD_V2_OFFLINE);
  });

  it('recusa CSC ausente em vez de gerar QR Code invalido', () => {
    // Um QR Code montado com CSC vazio é sintaticamente perfeito e
    // semanticamente lixo: a SEFAZ autoriza o cupom e a consulta do consumidor
    // falha depois. Falhar aqui é a única forma de a falha ser visível.
    expect(() => buildNfceQrCode({ ...base, cscToken: '' })).toThrow(
      CompanyCscNotConfiguredError,
    );
    expect(() => buildNfceQrCode({ ...base, cscId: '  ' })).toThrow(
      CompanyCscNotConfiguredError,
    );
  });

  it('nunca imprime o CSC na mensagem de erro', () => {
    try {
      buildNfceQrCode({ ...base, cscId: '' });
      fail('deveria ter lançado');
    } catch (error: unknown) {
      expect(String(error)).not.toContain(CSC_TOKEN);
    }
  });

  it('o CSC nao aparece no conteudo do QR Code', () => {
    // O CSC é segredo compartilhado com a SEFAZ. Ele ENTRA no hash e não pode
    // sair do outro lado — o QR Code é público, impresso em papel.
    const { qrCode } = buildNfceQrCode(base);
    expect(qrCode).not.toContain(CSC_TOKEN);
  });
});
