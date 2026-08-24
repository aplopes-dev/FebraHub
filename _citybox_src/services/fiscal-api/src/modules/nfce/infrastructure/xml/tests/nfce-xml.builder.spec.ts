import { SignedXml } from 'xml-crypto';
import { insertNfceSupplement, NfceNotSignedError } from '../nfce-xml.builder';
import { buildNfeXml } from '../../../../nfe/infrastructure/xml/nfe-xml.builder';
import { NFE_XSD_PATH } from '../../../../nfe/infrastructure/xml/nfe-xsd-path';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { buildSelfSignedCertificateFixture } from '../../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';
import { buildNfceQrCode } from '../../../domain/qr-code';

const URL_QRCODE = 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx';
const URL_CHAVE = 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/consulta.aspx';

function buildSignedNfce() {
  const { xml, accessKey } = buildNfeXml({
    environment: 'HOMOLOGATION',
    model: '65',
    // Consumidor não identificado — o caso comum no balcão.
    recipient: undefined,
    emitter: {
      cnpj: '11444777000161',
      legalName: 'EMPRESA DE TESTE LTDA',
      stateRegistration: '123456789',
      taxRegimeCode: '1',
      address: {
        street: 'Rua Teste',
        number: '1',
        complement: null,
        district: 'Centro',
        cityCodeIbge: '2913606',
        cityName: 'Ilhéus',
        uf: 'BA',
        zipCode: '45650-000',
      },
    },
    series: '1',
    number: '1',
    operationNature: 'VENDA AO CONSUMIDOR',
    operationType: '1',
    destinationIndicator: '1',
    finalConsumer: true,
    presenceIndicator: '1',
    items: [
      {
        description: 'CIMENTO CP II 50KG',
        ncm: '25232910',
        cfop: '5102',
        quantity: 2,
        unitValue: 42.5,
        totalValue: 85,
        csosn: '102',
      },
    ],
    paymentMethodCode: '01',
  });

  const cert = buildSelfSignedCertificateFixture();
  const signedXml = signXml({
    xml: xml.toString(),
    privateKeyPem: cert.privateKeyPem,
    certificatePem: cert.certificatePem,
    referenceXPath: "//*[local-name(.)='infNFe']",
    signatureLocationXPath: "//*[local-name(.)='NFe']",
    algorithmProfile: 'NFE_SEFAZ',
  });

  return { signedXml, accessKey, certificatePem: cert.certificatePem };
}

function buildQrCode(accessKey: string): string {
  return buildNfceQrCode({
    accessKey,
    environment: 'HOMOLOGATION',
    cscId: '000001',
    cscToken: 'CSC-DE-TESTE-NAO-E-SEGREDO-REAL',
    consultationUrl: URL_QRCODE,
  }).qrCode;
}

/// Verifica a assinatura de fato, com a mesma biblioteca que a produziu.
/// É a única asserção que prova que a inserção não estragou nada: comparar
/// strings ou contar elementos passaria mesmo com o digest quebrado.
///
/// A assinatura é extraída como texto em vez de por DOM porque `@xmldom/xmldom`
/// é dependência **transitiva** do `xml-crypto` — importá-la direto criaria um
/// acoplamento a algo que este projeto não declara e que pode sumir num bump.
function signatureIsValid(xml: string, certificatePem: string): boolean {
  const signature = /<Signature[\s\S]*<\/Signature>/.exec(xml)?.[0];
  if (!signature) return false;

  const sig = new SignedXml({ publicCert: certificatePem });
  sig.loadSignature(signature);
  return sig.checkSignature(xml);
}

describe('insertNfceSupplement', () => {
  it('insere infNFeSupl com qrCode e urlChave', () => {
    const { signedXml, accessKey } = buildSignedNfce();

    const result = insertNfceSupplement(signedXml, {
      qrCode: buildQrCode(accessKey),
      urlChave: URL_CHAVE,
    });

    expect(result).toContain('<infNFeSupl>');
    expect(result).toContain('<qrCode>');
    expect(result).toContain(`<urlChave>${URL_CHAVE}</urlChave>`);
  });

  it('⚠️ a assinatura CONTINUA VALIDA depois da insercao', () => {
    const { signedXml, accessKey, certificatePem } = buildSignedNfce();

    // Esta é a asserção central. `infNFeSupl` fica fora do elemento assinado
    // (a assinatura cobre `infNFe`), então inseri-lo depois é legítimo — mas só
    // enquanto a inserção não tocar num único byte de `infNFe`. Uma
    // implementação que reserializasse o documento por um DOM mudaria
    // espaçamento e quebraria o digest **sem quebrar nenhum outro teste**.
    expect(signatureIsValid(signedXml, certificatePem)).toBe(true);

    const result = insertNfceSupplement(signedXml, {
      qrCode: buildQrCode(accessKey),
      urlChave: URL_CHAVE,
    });

    expect(signatureIsValid(result, certificatePem)).toBe(true);
  });

  it('coloca infNFeSupl ENTRE infNFe e Signature, como o XSD exige', () => {
    const { signedXml, accessKey } = buildSignedNfce();

    const result = insertNfceSupplement(signedXml, {
      qrCode: buildQrCode(accessKey),
      urlChave: URL_CHAVE,
    });

    // TNFe é `xs:sequence`: infNFe, infNFeSupl, Signature. Anexar no fim
    // (depois de Signature) produziria XML reprovado por schema — e o signer
    // faz append em `NFe`, então Signature já está no fim.
    const fimInfNFe = result.indexOf('</infNFe>');
    const supl = result.indexOf('<infNFeSupl>');
    const assinatura = result.indexOf('<Signature');

    expect(fimInfNFe).toBeGreaterThan(-1);
    expect(supl).toBeGreaterThan(fimInfNFe);
    expect(assinatura).toBeGreaterThan(supl);
  });

  it('o resultado valida contra o nfe_v4.00.xsd oficial', () => {
    const { signedXml, accessKey } = buildSignedNfce();

    const result = insertNfceSupplement(signedXml, {
      qrCode: buildQrCode(accessKey),
      urlChave: URL_CHAVE,
    });

    expect(() =>
      assertValidXml(result, NFE_XSD_PATH, 'nfce-xml.builder.spec'),
    ).not.toThrow();
  });

  it('recusa XML nao assinado em vez de produzir cupom sem QR Code', () => {
    // Sem `<Signature>` não há onde inserir, e o modo de falha silencioso seria
    // devolver o XML intacto: cupom transmitido sem QR Code, autorizado, e
    // inconsultável pelo consumidor.
    expect(() =>
      insertNfceSupplement('<NFe><infNFe Id="NFe1"></infNFe></NFe>', {
        qrCode: buildQrCode('29260811444777000161650010000000011000000015'),
        urlChave: URL_CHAVE,
      }),
    ).toThrow(NfceNotSignedError);
  });

  it('escapa o conteudo do qrCode: o & do XML nao pode virar entidade solta', () => {
    const { signedXml, accessKey } = buildSignedNfce();

    const result = insertNfceSupplement(signedXml, {
      qrCode: buildQrCode(accessKey),
      urlChave: `${URL_CHAVE}?a=1&b=2`,
    });

    // Um `&` cru quebra o parse do XML inteiro — a SEFAZ recusaria o lote
    // todo, não só este cupom.
    expect(result).toContain('&amp;b=2');
    // `assertValidXml` faz parse real + validação de schema: se o `&` tivesse
    // escapado cru, o documento inteiro deixaria de fazer parse.
    expect(() =>
      assertValidXml(result, NFE_XSD_PATH, 'nfce-xml.builder.spec'),
    ).not.toThrow();
  });
});
