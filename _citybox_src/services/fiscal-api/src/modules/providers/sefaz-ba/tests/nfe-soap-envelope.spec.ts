import {
  buildConsultaProtocoloXml,
  buildEnvEventoXml,
  buildEnviNfeXml,
  buildInutNfeXml,
  buildNfeEventXml,
  parseRetConsSitNfeXml,
  parseRetEnvEventoXml,
  parseRetEnviNfeXml,
  parseRetInutNfeXml,
} from '../infrastructure/nfe-soap-envelope';

const ACCESS_KEY = '12345678901234567890123456789012345678901234';

const SIGNED_NFE_XML =
  '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe12345678901234567890123456789012345678901234" versao="4.00">...</infNFe><Signature>...</Signature></NFe>';

function retEnviNfeAuthorized(): string {
  return (
    '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
    '<tpAmb>2</tpAmb><cStat>104</cStat><xMotivo>Lote processado</xMotivo>' +
    '<protNFe versao="4.00"><infProt>' +
    '<tpAmb>2</tpAmb><chNFe>12345678901234567890123456789012345678901234</chNFe>' +
    '<dhRecbto>2026-08-04T10:00:00-03:00</dhRecbto><nProt>129260000000001</nProt>' +
    '<cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo>' +
    '</infProt></protNFe>' +
    '</retEnviNFe>'
  );
}

describe('buildEnviNfeXml', () => {
  it('wraps the signed NFe XML with idLote and indSinc=1 (synchronous)', () => {
    const xml = buildEnviNfeXml({ idLote: '1', signedNfeXml: SIGNED_NFE_XML });

    expect(xml).toContain(
      '<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">',
    );
    expect(xml).toContain('<idLote>1</idLote>');
    expect(xml).toContain('<indSinc>1</indSinc>');
    expect(xml).toContain(SIGNED_NFE_XML);
  });
});

describe('buildConsultaProtocoloXml', () => {
  it('builds consSitNFe with tpAmb=2 for homologation', () => {
    const xml = buildConsultaProtocoloXml({
      environment: 'HOMOLOGATION',
      accessKey: '12345678901234567890123456789012345678901234',
    });

    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<xServ>CONSULTAR</xServ>');
    expect(xml).toContain(
      '<chNFe>12345678901234567890123456789012345678901234</chNFe>',
    );
  });

  it('builds consSitNFe with tpAmb=1 for production', () => {
    const xml = buildConsultaProtocoloXml({
      environment: 'PRODUCTION',
      accessKey: '12345678901234567890123456789012345678901234',
    });

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });
});

describe('parseRetEnviNfeXml', () => {
  it('maps cStat=104 (lote) + infProt.cStat=100 to AUTHORIZED, combining NFe+protNFe into nfeProc', () => {
    const result = parseRetEnviNfeXml(retEnviNfeAuthorized(), SIGNED_NFE_XML);

    expect(result.status).toBe('AUTHORIZED');
    if (result.status === 'AUTHORIZED') {
      expect(result.protocol).toBe('129260000000001');
      expect(result.accessKey).toBe(
        '12345678901234567890123456789012345678901234',
      );
      expect(result.authorizedXml).toContain('<nfeProc');
      expect(result.authorizedXml).toContain(SIGNED_NFE_XML);
      expect(result.authorizedXml).toContain('<protNFe');
      expect(result.authorizedXml).toContain('<nProt>129260000000001</nProt>');
    }
  });

  it('maps infProt.cStat=110 to DENIED', () => {
    const xml =
      '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<cStat>104</cStat><xMotivo>Lote processado</xMotivo>' +
      '<protNFe><infProt><cStat>110</cStat><xMotivo>Uso Denegado: Irregularidade fiscal</xMotivo></infProt></protNFe>' +
      '</retEnviNFe>';

    const result = parseRetEnviNfeXml(xml, SIGNED_NFE_XML);

    expect(result.status).toBe('DENIED');
    if (result.status === 'DENIED') {
      expect(result.errorCode).toBe('110');
      expect(result.errorMessage).toContain('Irregularidade fiscal');
    }
  });

  it('maps infProt.cStat with an unmapped rejection code to REJECTED', () => {
    const xml =
      '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<cStat>104</cStat><xMotivo>Lote processado</xMotivo>' +
      '<protNFe><infProt><cStat>225</cStat><xMotivo>Falha no Schema XML</xMotivo></infProt></protNFe>' +
      '</retEnviNFe>';

    const result = parseRetEnviNfeXml(xml, SIGNED_NFE_XML);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('225');
      expect(result.errorMessage).toContain('Falha no Schema XML');
    }
  });

  it('maps lote cStat=105 (ainda em processamento) to SYNC_REQUIRED', () => {
    const xml =
      '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<cStat>105</cStat><xMotivo>Lote em processamento</xMotivo>' +
      '</retEnviNFe>';

    const result = parseRetEnviNfeXml(xml, SIGNED_NFE_XML);

    expect(result.status).toBe('SYNC_REQUIRED');
  });

  it('maps an unexpected lote-level cStat to REJECTED (fails closed)', () => {
    const xml =
      '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<cStat>215</cStat><xMotivo>Rejeição: falha de schema no lote</xMotivo>' +
      '</retEnviNFe>';

    const result = parseRetEnviNfeXml(xml, SIGNED_NFE_XML);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('215');
    }
  });
});

describe('parseRetConsSitNfeXml', () => {
  it('maps cStat=100 to AUTHORIZED', () => {
    const xml =
      '<retConsSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<tpAmb>2</tpAmb><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo>' +
      '<chNFe>12345678901234567890123456789012345678901234</chNFe>' +
      '<protNFe><infProt><nProt>129260000000001</nProt></infProt></protNFe>' +
      '</retConsSitNFe>';

    const result = parseRetConsSitNfeXml(xml);

    expect(result.status).toBe('AUTHORIZED');
    if (result.status === 'AUTHORIZED') {
      expect(result.protocol).toBe('129260000000001');
      expect(result.accessKey).toBe(
        '12345678901234567890123456789012345678901234',
      );
    }
  });

  it('maps cStat=217 (não consta) to REJECTED', () => {
    const xml =
      '<retConsSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<cStat>217</cStat><xMotivo>NF-e não consta na base de dados da SEFAZ</xMotivo>' +
      '</retConsSitNFe>';

    const result = parseRetConsSitNfeXml(xml);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('217');
    }
  });
});

describe('buildNfeEventXml', () => {
  it('builds a CANCEL evento with tpEvento=110111 and the composed Id', () => {
    const { unsignedEventoXml, eventId } = buildNfeEventXml({
      eventKind: 'CANCEL',
      environment: 'HOMOLOGATION',
      accessKey: ACCESS_KEY,
      cnpj: '11222333000181',
      sequence: 1,
      eventDateTime: new Date('2026-08-04T13:00:00-03:00'),
      protocol: '129260000000001',
      justification: 'Erro no preenchimento do pedido original',
    });

    expect(eventId).toBe(`ID110111${ACCESS_KEY}01`);
    expect(unsignedEventoXml).toContain('<tpEvento>110111</tpEvento>');
    // O elemento NAO leva zero a esquerda (pattern `[1-9][0-9]?`); o `Id` leva.
    // Este teste afirmava `01` e por isso nao pegou a rejeicao da SEFAZ — o
    // XSD do evento nao e validado localmente, entao so a transmissao real
    // revelou.
    expect(unsignedEventoXml).toContain('<nSeqEvento>1</nSeqEvento>');
    expect(unsignedEventoXml).toContain('01"');
    expect(unsignedEventoXml).toContain(`<chNFe>${ACCESS_KEY}</chNFe>`);
    expect(unsignedEventoXml).toContain('<tpAmb>2</tpAmb>');
    expect(unsignedEventoXml).toContain(
      '<nProt>129260000000001</nProt><xJust>Erro no preenchimento do pedido original</xJust>',
    );
    expect(unsignedEventoXml).toContain(`Id="ID110111${ACCESS_KEY}01"`);
  });

  it('builds a CORRECTION_LETTER evento with tpEvento=110110 and xCorrecao/xCondUso', () => {
    const { unsignedEventoXml, eventId } = buildNfeEventXml({
      eventKind: 'CORRECTION_LETTER',
      environment: 'HOMOLOGATION',
      accessKey: ACCESS_KEY,
      cnpj: '11222333000181',
      sequence: 2,
      eventDateTime: new Date('2026-08-04T13:00:00-03:00'),
      correctionText: 'Corrige o número do pedido de compra informado',
    });

    expect(eventId).toBe(`ID110110${ACCESS_KEY}02`);
    expect(unsignedEventoXml).toContain('<tpEvento>110110</tpEvento>');
    // Elemento sem zero a esquerda, `Id` com — ver comentario em
    // `nfe-soap-envelope.ts`. Este teste tambem afirmava o formato errado.
    expect(unsignedEventoXml).toContain('<nSeqEvento>2</nSeqEvento>');
    expect(unsignedEventoXml).toContain('02"');
    expect(unsignedEventoXml).toContain(
      '<xCorrecao>Corrige o número do pedido de compra informado</xCorrecao>',
    );
    expect(unsignedEventoXml).toContain('<xCondUso>');
  });

  it('escapes XML-special characters in free-text fields', () => {
    const { unsignedEventoXml } = buildNfeEventXml({
      eventKind: 'CANCEL',
      environment: 'HOMOLOGATION',
      accessKey: ACCESS_KEY,
      cnpj: '11222333000181',
      sequence: 1,
      eventDateTime: new Date('2026-08-04T13:00:00-03:00'),
      protocol: '129260000000001',
      justification: 'Pedido cancelado & não confirmado <erro>',
    });

    expect(unsignedEventoXml).toContain(
      'Pedido cancelado &amp; não confirmado &lt;erro&gt;',
    );
  });
});

describe('buildEnvEventoXml', () => {
  it('wraps the signed evento XML with idLote', () => {
    const xml = buildEnvEventoXml({
      idLote: '1',
      signedEventoXml: '<evento>...</evento>',
    });

    expect(xml).toContain(
      '<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">',
    );
    expect(xml).toContain('<idLote>1</idLote>');
    expect(xml).toContain('<evento>...</evento>');
  });
});

describe('parseRetEnvEventoXml', () => {
  it('maps lote cStat=128 + infEvento cStat=135 to AUTHORIZED', () => {
    const xml =
      '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
      '<idLote>1</idLote><tpAmb>2</tpAmb><cStat>128</cStat>' +
      '<xMotivo>Lote de Evento Processado</xMotivo>' +
      '<retEvento versao="1.00"><infEvento>' +
      '<tpAmb>2</tpAmb><cStat>135</cStat>' +
      '<xMotivo>Evento registrado e vinculado a NF-e</xMotivo>' +
      `<chNFe>${ACCESS_KEY}</chNFe><tpEvento>110111</tpEvento>` +
      '<nProt>129260000000002</nProt>' +
      '</infEvento></retEvento></retEnvEvento>';

    const result = parseRetEnvEventoXml(xml);

    expect(result.status).toBe('AUTHORIZED');
    if (result.status === 'AUTHORIZED') {
      expect(result.protocol).toBe('129260000000002');
      expect(result.responseXml).toBe(xml);
    }
  });

  it('maps an infEvento cStat other than 135 to REJECTED', () => {
    const xml =
      '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
      '<cStat>128</cStat><xMotivo>Lote de Evento Processado</xMotivo>' +
      '<retEvento versao="1.00"><infEvento>' +
      '<cStat>573</cStat><xMotivo>Duplicidade de Evento</xMotivo>' +
      '</infEvento></retEvento></retEnvEvento>';

    const result = parseRetEnvEventoXml(xml);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('573');
      expect(result.errorMessage).toContain('Duplicidade de Evento');
    }
  });

  it('maps an unexpected lote-level cStat to REJECTED (fails closed)', () => {
    const xml =
      '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
      '<cStat>215</cStat><xMotivo>Rejeição: falha de schema no lote</xMotivo>' +
      '</retEnvEvento>';

    const result = parseRetEnvEventoXml(xml);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('215');
    }
  });
});

describe('buildInutNfeXml', () => {
  it('builds an inutNFe with the composed infInut Id and range fields', () => {
    const { unsignedInutNfeXml, infInutId } = buildInutNfeXml({
      environment: 'HOMOLOGATION',
      cUF: '29',
      cnpj: '11222333000181',
      series: '1',
      numberStart: '100',
      numberEnd: '110',
      model: '55',
      justification: 'Faixa reservada e não utilizada no período',
      requestDateTime: new Date('2026-08-05T10:00:00-03:00'),
    });

    expect(infInutId).toBe('ID29261122233300018155001000000100000000110');
    expect(unsignedInutNfeXml).toContain('<xServ>INUTILIZAR</xServ>');
    expect(unsignedInutNfeXml).toContain('<cUF>29</cUF>');
    expect(unsignedInutNfeXml).toContain('<ano>26</ano>');
    expect(unsignedInutNfeXml).toContain('<serie>1</serie>');
    expect(unsignedInutNfeXml).toContain('<nNFIni>100</nNFIni>');
    expect(unsignedInutNfeXml).toContain('<nNFFin>110</nNFFin>');
    expect(unsignedInutNfeXml).toContain(`Id="${infInutId}"`);
    expect(unsignedInutNfeXml).toContain('<tpAmb>2</tpAmb>');
  });

  it('escapes XML-special characters in the justification', () => {
    const { unsignedInutNfeXml } = buildInutNfeXml({
      environment: 'HOMOLOGATION',
      cUF: '29',
      cnpj: '11222333000181',
      series: '1',
      numberStart: '100',
      numberEnd: '110',
      model: '55',
      justification: 'Faixa reservada & não utilizada <erro>',
      requestDateTime: new Date('2026-08-05T10:00:00-03:00'),
    });

    expect(unsignedInutNfeXml).toContain(
      'Faixa reservada &amp; não utilizada &lt;erro&gt;',
    );
  });
});

describe('parseRetInutNfeXml', () => {
  it('maps cStat=102 to INUTILIZED', () => {
    const xml =
      '<retInutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<infInut><cStat>102</cStat>' +
      '<xMotivo>Inutilização de número homologado</xMotivo>' +
      '<nProt>129260000000199</nProt></infInut></retInutNFe>';

    const result = parseRetInutNfeXml(xml);

    expect(result.status).toBe('INUTILIZED');
    if (result.status === 'INUTILIZED') {
      expect(result.protocol).toBe('129260000000199');
      expect(result.responseXml).toBe(xml);
    }
  });

  it('maps an unmapped cStat to REJECTED (fails closed)', () => {
    const xml =
      '<retInutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
      '<infInut><cStat>563</cStat>' +
      '<xMotivo>Rejeição: NF-e já existente na faixa</xMotivo></infInut></retInutNFe>';

    const result = parseRetInutNfeXml(xml);

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') {
      expect(result.errorCode).toBe('563');
      expect(result.errorMessage).toContain('NF-e já existente na faixa');
    }
  });
});

/// Verificado contra a SEFAZ-BA de homologação em 2026-08-06: embutir o XML
/// assinado com a declaração `<?xml?>` intacta produz um envelope com duas
/// declarações — XML malformado, que o IIS da SEFAZ recusa com HTTP 400 antes
/// de qualquer processamento SOAP. O sintoma não aponta para a causa, por isso
/// o teste.
describe('declaração XML embutida', () => {
  const signed =
    '<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe123"/></NFe>';

  it('does not carry the XML declaration of the signed document into enviNFe', () => {
    const xml = buildEnviNfeXml({ idLote: '1', signedNfeXml: signed });

    expect(xml).not.toContain('<?xml');
    expect(xml).toContain('<NFe xmlns=');
    expect(xml).toContain('<idLote>1</idLote>');
  });
});
