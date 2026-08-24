import {
  buildDpsXml,
  type BuildDpsXmlInput,
} from '../../../nfse/infrastructure/xml/dps-xml.builder';

/// XML de NFS-e **autorizada** para testes de renderização do DANFSE.
///
/// Mesma estratégia da fixture de NF-e: gerada pelo builder de produção
/// (`buildDpsXml`) e envolvida no `NFSe`/`infNFSe` que o Sefin devolve.
///
/// A diferença estrutural em relação à NF-e importa para o leiaute: no Padrão
/// Nacional o contribuinte transmite a **DPS**, e é o **Sefin** que gera a
/// NFS-e. O XML autorizado, portanto, é um `NFSe` que **contém** a DPS
/// original — não uma DPS com protocolo anexado. O DANFSE mostra dados dos dois
/// níveis: número e chave vêm do `infNFSe`, prestador e serviço vêm da DPS
/// aninhada.
///
/// Também não há "protocolo" separado como na NF-e: no Padrão Nacional a
/// **chave de acesso é o identificador** do documento gerado.

export function buildAuthorizedNfseXml(
  overrides: Partial<BuildDpsXmlInput> = {},
): { xml: string; accessKey: string; dpsId: string } {
  const input: BuildDpsXmlInput = {
    environment: 'HOMOLOGATION',
    provider: {
      cnpj: '50031609000104',
      legalName: 'RR EMPREENDIMENTOS E COMERCIO VAREJISTA LTDA',
      municipalRegistration: null,
      cityCodeIbge: '2913606',
      simplesNacionalOption: '3',
    },
    customer: {
      documentType: 'CNPJ',
      document: '13937073000156',
      name: 'TOMADOR DE HOMOLOGAÇÃO LTDA',
    },
    service: {
      description: 'Serviço de instalação predial com mão de obra e materiais',
      municipalServiceCode: '07.02',
      nationalServiceCode: '070201',
      issRate: 0.02,
      issWithheld: false,
      totalValue: 1500,
    },
    series: '1',
    number: '1',
    // Data fixa: uma data variável faria o conteúdo do PDF mudar entre
    // execuções, e a asserção de reimpressão idêntica (FR-008) perderia
    // sentido.
    emissionDate: new Date('2026-08-07T12:00:00-03:00'),
    ...overrides,
  };

  const built = buildDpsXml(input);
  const dpsXml = built.xml.toString('utf-8').replace(/^<\?xml[^?]*\?>\s*/, '');

  // Chave da NFS-e (50 dígitos) — distinta do id da DPS. Confundir as duas foi
  // um defeito real na integração: a substituição quebrava porque a nota
  // guardava o id da DPS onde deveria estar a chave da NFS-e.
  const accessKey = '29136062250031609000104000000000002026080715989993';

  const authorizedXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">',
    `<infNFSe Id="NFS${accessKey}">`,
    `<xLocEmi>Ilhéus</xLocEmi>`,
    `<xLocPrestacao>Ilhéus</xLocPrestacao>`,
    '<nNFSe>1</nNFSe>',
    '<cLocIncid>2913606</cLocIncid>',
    '<xTribNac>Servicos de instalacao</xTribNac>',
    '<verAplic>SefinNacional_1.00</verAplic>',
    '<ambGer>2</ambGer>',
    '<tpEmis>1</tpEmis>',
    '<procEmi>1</procEmi>',
    '<dhProc>2026-08-07T12:00:05-03:00</dhProc>',
    '<nDFSe>1</nDFSe>',
    // ⚠️ O grupo `emit` é preenchido pelo **Sefin**, não pelo contribuinte.
    // A DPS transmitida NÃO pode conter `xNome` do prestador — o Sefin rejeita
    // com `E0121`, porque deduz a razão social pelo CNPJ. Logo, o DANFSE só
    // consegue imprimir o nome do prestador lendo daqui.
    '<emit>',
    '<CNPJ>50031609000104</CNPJ>',
    '<xNome>RR EMPREENDIMENTOS E COMÉRCIO VAREJISTA LTDA</xNome>',
    '<enderNac><xLgr>Rua Marques de Paranagua</xLgr><nro>100</nro>',
    '<xBairro>Centro</xBairro><cMun>2913606</cMun><UF>BA</UF>',
    '<CEP>45650000</CEP></enderNac>',
    '</emit>',
    dpsXml,
    '<valores><vLiq>1500.00</vLiq></valores>',
    '</infNFSe>',
    '</NFSe>',
  ].join('');

  return { xml: authorizedXml, accessKey, dpsId: built.dpsId };
}

/// XML de NFS-e autorizada **completa** — todos os grupos que a NT 008/2026
/// exige no DANFSE: endereço de tomador, intermediário, descontos, base de
/// cálculo, retenções federais (IRRF/PIS/COFINS/CSLL/INSS) e totalizadores.
///
/// Hand-authored de propósito: o `buildDpsXml` de produção só emite a prestação
/// simples e doméstica (sem intermediário, sem `tribFed`). Testar presença de
/// campos que o builder não gera exige um XML que os contenha. Espelha a
/// estrutura real do Sefin: `infNFSe` (valores calculados) contendo a `DPS`.
///
/// Par com `buildAuthorizedNfseXml` (mínima): a mínima exercita **omissão**
/// (seções ausentes não aparecem), esta exercita **presença**.
export function buildAuthorizedNfseXmlFull(): {
  xml: string;
  accessKey: string;
} {
  const accessKey = '29136062250031609000104000000000002026080715989993';

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">',
    `<infNFSe Id="NFS${accessKey}">`,
    '<xLocEmi>Ilhéus</xLocEmi>',
    '<xLocPrestacao>Ilhéus</xLocPrestacao>',
    '<nNFSe>42</nNFSe>',
    '<cLocIncid>2913606</cLocIncid>',
    '<dhProc>2026-08-07T12:00:05-03:00</dhProc>',
    '<emit>',
    '<CNPJ>50031609000104</CNPJ>',
    '<IM>123456</IM>',
    '<xNome>RR EMPREENDIMENTOS E COMÉRCIO VAREJISTA LTDA</xNome>',
    '<enderNac><xLgr>Rua Marques de Paranagua</xLgr><nro>100</nro>',
    '<xCpl>Sala 2</xCpl><xBairro>Centro</xBairro><cMun>2913606</cMun>',
    '<UF>BA</UF><CEP>45650000</CEP></enderNac>',
    '</emit>',
    // Valores CALCULADOS pelo Sefin (TCValoresNFSe).
    '<valores>',
    '<vCalcDR>50.00</vCalcDR>',
    '<vBC>1450.00</vBC>',
    '<vISSQN>29.00</vISSQN>',
    '<vTotalRet>217.50</vTotalRet>',
    '<vLiq>1182.50</vLiq>',
    '</valores>',
    // DPS transmitida pelo contribuinte (TCDPS > infDPS).
    '<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01">',
    '<infDPS Id="DPS29136062500316090001040000010000000000001">',
    '<tpAmb>2</tpAmb><dhEmi>2026-08-07T12:00:00-03:00</dhEmi>',
    '<serie>00001</serie><nDPS>42</nDPS><dCompet>2026-08-07</dCompet>',
    '<tpEmit>1</tpEmit><cLocEmi>2913606</cLocEmi>',
    '<prest><CNPJ>50031609000104</CNPJ><IM>123456</IM></prest>',
    '<toma>',
    '<CNPJ>13937073000156</CNPJ>',
    '<xNome>TOMADOR DE HOMOLOGAÇÃO LTDA</xNome>',
    '<end><endNac><cMun>2927408</cMun><CEP>40010000</CEP></endNac>',
    '<xLgr>Avenida Sete de Setembro</xLgr><nro>200</nro>',
    '<xBairro>Comercio</xBairro></end>',
    '</toma>',
    '<interm><CNPJ>19131243000197</CNPJ>',
    '<xNome>INTERMEDIARIO DE PAGAMENTO SA</xNome></interm>',
    '<serv><locPrest><cLocPrestacao>2913606</cLocPrestacao></locPrest>',
    '<cServ><cTribNac>070201</cTribNac><cTribMun>0702</cTribMun>',
    '<xDescServ>Serviço de instalação predial com mão de obra e materiais</xDescServ></cServ></serv>',
    '<valores>',
    '<vServPrest><vServ>1500.00</vServ></vServPrest>',
    '<vDescCondIncond><vDescIncond>50.00</vDescIncond></vDescCondIncond>',
    '<trib>',
    '<tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>2</tpRetISSQN><pAliq>2.00</pAliq></tribMun>',
    '<tribFed>',
    '<piscofins><CST>01</CST><vPis>9.75</vPis><vCofins>45.00</vCofins></piscofins>',
    '<vRetCP>165.00</vRetCP><vRetIRRF>22.50</vRetIRRF><vRetCSLL>13.50</vRetCSLL>',
    '</tribFed>',
    '<totTrib><vTotTrib><vTotTribFed>90.75</vTotTribFed>',
    '<vTotTribEst>0.00</vTotTribEst><vTotTribMun>29.00</vTotTribMun></vTotTrib></totTrib>',
    '</trib>',
    '</valores>',
    '</infDPS>',
    '</DPS>',
    '</infNFSe>',
    '</NFSe>',
  ].join('');

  return { xml, accessKey };
}
