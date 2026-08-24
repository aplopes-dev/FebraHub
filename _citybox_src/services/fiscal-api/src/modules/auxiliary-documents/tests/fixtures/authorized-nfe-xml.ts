import {
  buildNfeXml,
  type BuildNfeXmlInput,
} from '../../../nfe/infrastructure/xml/nfe-xml.builder';

/// XML de NF-e **autorizada** para testes de renderização.
///
/// Gerado pelo `buildNfeXml` de produção e envolvido em `nfeProc` com um
/// `protNFe` sintético — em vez de um arquivo `.xml` commitado.
///
/// Duas razões, e a segunda é a que importa:
///
/// 1. Um XML colado de uma emissão real carrega CNPJ, endereço e CPF de pessoas
///    de verdade. Não se commita isso.
/// 2. Um arquivo estático **congela** no formato do dia em que foi salvo. Se o
///    builder mudar — e ele mudou várias vezes durante a integração com a
///    SEFAZ — o fixture continuaria passando enquanto a produção emitiria
///    outra coisa. Gerando pelo builder, o teste de renderização acompanha o
///    que o sistema realmente produz.
///
/// O `protNFe` é sintético porque é o único pedaço que só a SEFAZ produz, e
/// nada no DANFE depende de ele ser criptograficamente válido — só de estar lá
/// com o número de protocolo e a data.

export const FIXTURE_PROTOCOL = '129261000154551';

export function buildAuthorizedNfeXml(
  overrides: Partial<BuildNfeXmlInput> = {},
): { xml: string; accessKey: string; protocol: string } {
  const input: BuildNfeXmlInput = {
    environment: 'HOMOLOGATION',
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
    recipient: {
      // CNPJ da própria SEFAZ, usado em homologação — não é dado de pessoa.
      document: '13937073000156',
      documentType: 'CNPJ',
      name: 'DESTINATARIO HOMOLOGACAO',
      address: {
        street: 'Rua Cliente',
        number: '1',
        district: 'Centro',
        cityCodeIbge: '2913606',
        cityName: 'Ilheus',
        uf: 'BA',
        zipCode: '45650-000',
      },
    },
    series: '1',
    number: '1',
    operationNature: 'Venda de mercadoria',
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
    // Data fixa: uma data variável faria o conteúdo do PDF mudar entre
    // execuções, e a asserção de reimpressão idêntica (FR-008) perderia
    // sentido.
    emissionDate: new Date('2026-08-07T12:00:00-03:00'),
    ...overrides,
  };

  const { xml, accessKey } = buildNfeXml(input);

  // `nfeProc` é o envelope do que a SEFAZ devolve autorizado — é ele, e não a
  // `NFe` nua, que o emitente guarda e que o DANFE representa.
  // `buildNfeXml` devolve Buffer; o envelope é montado como texto.
  const nfeNode = xml.toString('utf-8').replace(/^<\?xml[^?]*\?>\s*/, '');
  const authorizedXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">',
    nfeNode,
    '<protNFe versao="4.00">',
    '<infProt>',
    '<tpAmb>2</tpAmb>',
    '<verAplic>BA_XX_v1</verAplic>',
    `<chNFe>${accessKey}</chNFe>`,
    '<dhRecbto>2026-08-07T12:00:05-03:00</dhRecbto>',
    `<nProt>${FIXTURE_PROTOCOL}</nProt>`,
    '<digVal>ZmFrZURpZ2VzdFZhbHVlMDAwMDA=</digVal>',
    '<cStat>100</cStat>',
    '<xMotivo>Autorizado o uso da NF-e</xMotivo>',
    '</infProt>',
    '</protNFe>',
    '</nfeProc>',
  ].join('');

  return { xml: authorizedXml, accessKey, protocol: FIXTURE_PROTOCOL };
}
