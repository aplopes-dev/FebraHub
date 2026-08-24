import {
  buildNfeXml,
  type BuildNfeXmlInput,
} from '../../../nfe/infrastructure/xml/nfe-xml.builder';
import { insertNfceSupplement } from '../../../nfce/infrastructure/xml/nfce-xml.builder';
import { buildNfceQrCode } from '../../../nfce/domain/qr-code';

/// XML de **NFC-e autorizada** para testes de renderização.
///
/// Mesma política do fixture de NF-e: gerado pelos builders de produção, nunca
/// um `.xml` estático. Um arquivo colado de emissão real carrega dados de
/// pessoas, e um arquivo congelado continua passando depois que a produção
/// passa a emitir outra coisa.
///
/// ⚠️ Aqui o argumento é mais forte que na NF-e: este fixture carrega
/// `infNFeSupl`, e é ele que o renderizador de bobina usa para desenhar o QR
/// Code. Se o suplemento fosse escrito à mão no fixture, o teste de leiaute
/// passaria mesmo com `insertNfceSupplement` quebrado — exatamente a falha que
/// a spec 005 mais teme.
export const NFCE_FIXTURE_PROTOCOL = '129261000154552';

const URL_QRCODE = 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx';
const URL_CHAVE = 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/consulta.aspx';

export function buildAuthorizedNfceXml(
  overrides: Partial<BuildNfeXmlInput> = {},
): { xml: string; accessKey: string; protocol: string; qrCode: string } {
  const input: BuildNfeXmlInput = {
    environment: 'HOMOLOGATION',
    model: '65',
    emissionType: '1',
    emitter: {
      cnpj: '50031609000104',
      legalName: 'RR EMPREENDIMENTOS E COMERCIO VAREJISTA LTDA',
      stateRegistration: '204887605',
      taxRegimeCode: '1',
      address: {
        street: 'Rua Marques de Paranagua',
        number: '100',
        district: 'Centro',
        cityCodeIbge: '2913606',
        cityName: 'Ilheus',
        uf: 'BA',
        zipCode: '45650-000',
      },
    },
    // Consumidor não identificado — o caso comum no balcão, e o que o cupom
    // precisa saber imprimir.
    recipient: undefined,
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
    // Data fixa: variável faria o conteúdo do PDF mudar entre execuções, e a
    // asserção de reimpressão idêntica perderia sentido.
    emissionDate: new Date('2026-08-07T12:00:00-03:00'),
    ...overrides,
  };

  const { xml, accessKey } = buildNfeXml(input);

  const { qrCode } = buildNfceQrCode({
    accessKey,
    environment: input.environment,
    cscId: '000001',
    cscToken: 'CSC-DE-TESTE-NAO-E-SEGREDO-REAL',
    consultationUrl: URL_QRCODE,
  });

  // Suplemento inserido pelo caminho de produção. O fixture aceita
  // `<Signature/>` vazia porque `insertNfceSupplement` só precisa dela como
  // marco de posição — e usá-la aqui mantém a inserção sob o mesmo código que
  // a emissão real executa.
  const nfeNode = xml
    .toString('utf-8')
    .replace(/^<\?xml[^?]*\?>\s*/, '')
    .replace('</NFe>', '<Signature/></NFe>');

  const supplemented = insertNfceSupplement(nfeNode, {
    qrCode,
    urlChave: URL_CHAVE,
  });

  const authorizedXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">',
    supplemented,
    '<protNFe versao="4.00">',
    '<infProt>',
    '<tpAmb>2</tpAmb>',
    '<verAplic>BA_XX_v1</verAplic>',
    `<chNFe>${accessKey}</chNFe>`,
    '<dhRecbto>2026-08-07T12:00:05-03:00</dhRecbto>',
    `<nProt>${NFCE_FIXTURE_PROTOCOL}</nProt>`,
    '<digVal>ZmFrZURpZ2VzdFZhbHVlMDAwMDA=</digVal>',
    '<cStat>100</cStat>',
    '<xMotivo>Autorizado o uso da NF-e</xMotivo>',
    '</infProt>',
    '</protNFe>',
    '</nfeProc>',
  ].join('');

  return {
    xml: authorizedXml,
    accessKey,
    protocol: NFCE_FIXTURE_PROTOCOL,
    qrCode,
  };
}
