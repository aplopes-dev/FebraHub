import {
  buildNfeXml,
  type BuildNfeXmlInput,
  type NfeRecipient,
} from '../nfe-xml.builder';

/// Extraído para constante tipada porque `BuildNfeXmlInput['recipient']` passou
/// a ser opcional (NFC-e admite consumidor não identificado). Espalhar
/// `baseInput().recipient` traria as propriedades como opcionais.
const BASE_RECIPIENT: NfeRecipient = {
  document: '12345678900',
  documentType: 'CPF',
  name: 'Cliente Teste',
  address: {
    street: 'Rua Cliente',
    number: '1',
    district: 'Centro',
    cityCodeIbge: '2913606',
    cityName: 'Ilhéus',
    uf: 'BA',
    zipCode: '45650-000',
  },
};
import { NFE_XSD_PATH } from '../nfe-xsd-path';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { XmlValidationError } from '../../../../../shared/infra/fiscal-xml/errors/xml-validation.error';
import { buildSelfSignedCertificateFixture } from '../../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';

function baseInput(
  overrides: Partial<BuildNfeXmlInput> = {},
): BuildNfeXmlInput {
  return {
    environment: 'HOMOLOGATION',
    emitter: {
      cnpj: '11222333000181',
      legalName: 'EMPRESA TESTE LTDA',
      stateRegistration: '123456789',
      taxRegimeCode: '1',
      address: {
        street: 'Rua Marquês de Paranaguá',
        number: '100',
        district: 'Centro',
        cityCodeIbge: '2913606',
        cityName: 'Ilhéus',
        uf: 'BA',
        zipCode: '45650-000',
      },
    },
    recipient: {
      document: '12345678900',
      documentType: 'CPF',
      name: 'Cliente Teste',
      address: {
        street: 'Rua Cliente',
        number: '1',
        district: 'Centro',
        cityCodeIbge: '2913606',
        cityName: 'Ilhéus',
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
        description: 'Produto Teste',
        ncm: '61091000',
        cfop: '5102',
        quantity: 1,
        unitValue: 850,
        totalValue: 850,
        csosn: '102',
      },
    ],
    paymentMethodCode: '01',
    emissionDate: new Date(),
    ...overrides,
  };
}

/// Parametrização para NFC-e (spec 005). O builder atende **dois modelos**: a
/// NFC-e é `mod=65` no MESMO schema, com o mesmo webservice e a mesma
/// assinatura — muda o conteúdo, não o transporte.
describe('buildNfeXml — parametrização por modelo (NFC-e, spec 005)', () => {
  it('emite modelo 55 por padrao, preservando o comportamento da NF-e', () => {
    const { xml } = buildNfeXml(baseInput());

    expect(xml.toString('utf-8')).toContain('<mod>55</mod>');
  });

  it('emite modelo 65 quando pedido', () => {
    const { xml } = buildNfeXml(baseInput({ model: '65' }));

    expect(xml.toString('utf-8')).toContain('<mod>65</mod>');
  });

  it('leva o modelo para a CHAVE DE ACESSO, nao so para o ide', () => {
    // ⚠️ O modelo ocupa duas posições no XML: o elemento `ide/mod` e os
    // dígitos 21-22 da chave de acesso. Parametrizar só o primeiro produz uma
    // chave que diz "55" num documento que se declara "65" — inconsistência
    // que a SEFAZ rejeita, e que um teste olhando só o `<mod>` não pegaria.
    const { accessKey } = buildNfeXml(baseInput({ model: '65' }));

    expect(accessKey.slice(20, 22)).toBe('65');
  });

  it('usa tpImp=4 no modelo 65 — o DANFE NFC-e tem formato proprio', () => {
    // `tpImp` declara o formato de impressão. `1` é retrato (A4, DANFE da
    // NF-e); a NFC-e usa `4`. Deixar `1` num cupom declara um formato que o
    // documento impresso não tem.
    const xml = buildNfeXml(baseInput({ model: '65' })).xml.toString('utf-8');

    expect(xml).toContain('<tpImp>4</tpImp>');
  });

  it('aceita emissao em CONTINGENCIA (tpEmis=9)', () => {
    const { xml, accessKey } = buildNfeXml(
      baseInput({ model: '65', emissionType: '9' }),
    );

    expect(xml.toString('utf-8')).toContain('<tpEmis>9</tpEmis>');
    // O tipo de emissão também compõe a chave — dígito 35.
    expect(accessKey.slice(34, 35)).toBe('9');
  });

  it('permite AUSENCIA de destinatario — o caso comum no balcao', () => {
    // Consumidor não identificado é a norma na venda de balcão, não a exceção.
    const { xml } = buildNfeXml(
      baseInput({ model: '65', recipient: undefined }),
    );

    expect(xml.toString('utf-8')).not.toContain('<dest>');
  });

  it('mantem o destinatario obrigatorio em modelo 55', () => {
    // A NF-e exige destinatário. Tornar o campo opcional no tipo não pode
    // afrouxar a regra para o documento que sempre precisou dele.
    expect(() => buildNfeXml(baseInput({ recipient: undefined }))).toThrow();
  });
});

describe('buildNfeXml + signXml (pipeline completo contra o schema oficial)', () => {
  it('produces a signed NF-e XML that validates against the real nfe_v4.00.xsd', () => {
    const { xml, accessKey } = buildNfeXml(baseInput());
    expect(accessKey).toHaveLength(44);

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      // Exigência do schema oficial da SEFAZ (xmldsig-core-schema_v1.01.xsd
      // fixa SHA-1/RSA-SHA1/C14N simples) — não o perfil MODERN default.
      algorithmProfile: 'NFE_SEFAZ',
    });

    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'nfe-xml.builder.spec'),
    ).not.toThrow();
  });

  it('valida o XML modelo 65 (NFC-e) contra o MESMO nfe_v4.00.xsd', () => {
    // ⚠️ Confirma a premissa que sustenta toda a spec 005: NFC-e e NF-e
    // compartilham o schema. Se este teste falhasse, a decisão de estender o
    // builder em vez de criar um paralelo (research.md R1) estaria errada, e o
    // plano inteiro precisaria mudar.
    //
    // Vale também como regressão no sentido inverso: prova que parametrizar o
    // modelo não quebrou a NF-e, que o teste acima continua cobrindo.
    const { xml, accessKey } = buildNfeXml(
      baseInput({ model: '65', recipient: undefined }),
    );
    expect(accessKey).toHaveLength(44);

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'nfe-xml.builder.spec'),
    ).not.toThrow();
  });

  it('rejects (throws XmlValidationError) when signed with the MODERN algorithm profile instead of NFE_SEFAZ', () => {
    // Regressão do achado: o schema oficial FIXA os algoritmos do XMLDSig —
    // uma NF-e assinada com o perfil moderno (SHA-256/Exclusive-C14N) é
    // rejeitada pela validação XSD, mesmo sendo criptograficamente mais forte.
    const { xml } = buildNfeXml(baseInput());
    const certFixture = buildSelfSignedCertificateFixture();

    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'MODERN',
    });

    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'nfe-xml.builder.spec'),
    ).toThrow(XmlValidationError);
  });

  it('produces a valid NF-e for a Regime Normal emitter (CST instead of CSOSN)', () => {
    const { xml } = buildNfeXml(
      baseInput({
        emitter: {
          ...baseInput().emitter,
          taxRegimeCode: '3',
        },
        items: [
          {
            description: 'Produto Regime Normal',
            ncm: '61091000',
            cfop: '5102',
            quantity: 2,
            unitValue: 100,
            totalValue: 200,
            cst: '00',
          },
        ],
      }),
    );

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'nfe-xml.builder.spec'),
    ).not.toThrow();
    expect(xml.toString()).toContain('ICMS00');
  });

  it('generates a different access key for a different emission (unique cNF per millisecond)', () => {
    const first = buildNfeXml(baseInput({ emissionDate: new Date(1000) }));
    const second = buildNfeXml(baseInput({ emissionDate: new Date(2000) }));

    expect(first.accessKey).not.toBe(second.accessKey);
  });

  /// Regra do leiaute da NF-e, não escolha nossa: em `tpAmb=2` a razão social do
  /// destinatário tem de ser **exatamente** esta literal. A SEFAZ rejeita
  /// qualquer outro valor — é o que impede uma nota de homologação parecer real.
  ///
  /// Aplicado pelo builder, não pedido ao chamador: o ERP não deve precisar
  /// saber disso, e um operador que digitasse o nome errado teria a nota
  /// recusada sem entender por quê.
  describe('razão social do destinatário em homologação', () => {
    const LITERAL_HOMOLOGACAO =
      'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';

    it('replaces the recipient name with the mandatory literal in homologation', () => {
      const { xml } = buildNfeXml(
        baseInput({
          environment: 'HOMOLOGATION',
          recipient: {
            ...BASE_RECIPIENT,
            name: 'Daniel Anselmo de Oliveira Neto',
          },
        }),
      );

      expect(xml.toString('utf-8')).toContain(
        `<xNome>${LITERAL_HOMOLOGACAO}</xNome>`,
      );
      expect(xml.toString('utf-8')).not.toContain('Daniel Anselmo');
    });

    /// Só o NOME é substituído. O CPF/CNPJ continua o real — é ele que a SEFAZ
    /// usa para validar o destinatário, e trocá-lo invalidaria a nota.
    it('keeps the real recipient document untouched', () => {
      const { xml } = buildNfeXml(
        baseInput({
          environment: 'HOMOLOGATION',
          recipient: {
            ...BASE_RECIPIENT,
            document: '08118148580',
            name: 'Daniel Anselmo de Oliveira Neto',
          },
        }),
      );

      expect(xml.toString('utf-8')).toContain('<CPF>08118148580</CPF>');
    });

    it('keeps the real name in production', () => {
      const { xml } = buildNfeXml(
        baseInput({
          environment: 'PRODUCTION',
          recipient: {
            ...BASE_RECIPIENT,
            name: 'Daniel Anselmo de Oliveira Neto',
          },
        }),
      );

      expect(xml.toString('utf-8')).toContain(
        '<xNome>Daniel Anselmo de Oliveira Neto</xNome>',
      );
      expect(xml.toString('utf-8')).not.toContain(LITERAL_HOMOLOGACAO);
    });
  });

  /// Rejeição 486: a Bahia (e outras UFs) exigem o grupo `autXML` com o
  /// CNPJ/CPF do escritório de contabilidade. Sem ele a nota é recusada — não é
  /// opcional na prática, mesmo sendo `minOccurs="0"` no schema.
  describe('grupo autXML (escritório de contabilidade)', () => {
    it('emits autXML with the accounting office CNPJ when informed', () => {
      const { xml } = buildNfeXml(
        baseInput({ authorizedDownloadDocuments: ['36698609000123'] }),
      );

      expect(xml.toString('utf-8')).toContain(
        '<autXML><CNPJ>36698609000123</CNPJ></autXML>',
      );
    });

    /// 11 dígitos é CPF, 14 é CNPJ — o XSD tem `xs:choice`, e mandar CPF dentro
    /// de `<CNPJ>` é recusado por schema antes de chegar à regra de negócio.
    it('uses the CPF element for an 11-digit document', () => {
      const { xml } = buildNfeXml(
        baseInput({ authorizedDownloadDocuments: ['08118148580'] }),
      );

      expect(xml.toString('utf-8')).toContain(
        '<autXML><CPF>08118148580</CPF></autXML>',
      );
    });

    it('omits the group entirely when there is nobody authorised', () => {
      const { xml } = buildNfeXml(baseInput());
      expect(xml.toString('utf-8')).not.toContain('autXML');
    });

    /// O XSD permite até 10. Passar mais é erro de quem chama, e falhar aqui é
    /// melhor que ser recusado pelo órgão.
    it('refuses more than the ten entries the schema allows', () => {
      expect(() =>
        buildNfeXml(
          baseInput({
            authorizedDownloadDocuments: Array.from(
              { length: 11 },
              () => '36698609000123',
            ),
          }),
        ),
      ).toThrow(/10/);
    });
  });

  /// Rejeição 745 ("NF-e sem grupo do PIS"): PIS e COFINS são **obrigatórios**
  /// em toda nota, inclusive no Simples Nacional, onde as contribuições já são
  /// recolhidas no DAS. O grupo existe para declarar isso — não para cobrar.
  describe('grupos PIS e COFINS', () => {
    it('emits PIS and COFINS for a Simples Nacional item', () => {
      const { xml } = buildNfeXml(baseInput());
      const out = xml.toString('utf-8');

      // CST 49 (Outras Operações) com valores zerados: as contribuições saem
      // no DAS, então a nota declara sem tributar.
      expect(out).toContain('<PISOutr><CST>49</CST>');
      expect(out).toContain('<COFINSOutr><CST>49</CST>');
      expect(out).toContain('<vPIS>0.00</vPIS>');
      expect(out).toContain('<vCOFINS>0.00</vCOFINS>');
    });

    /// A ordem dos elementos é `xs:sequence`: CST → vBC → pPIS → vPIS. Fora
    /// dela o XML é recusado por schema antes de chegar à regra de negócio.
    it('keeps the element order the schema requires', () => {
      const out = buildNfeXml(baseInput()).xml.toString('utf-8');
      const pis = out.slice(
        out.indexOf('<PISOutr>'),
        out.indexOf('</PISOutr>'),
      );

      expect(pis.indexOf('<CST>')).toBeLessThan(pis.indexOf('<vBC>'));
      expect(pis.indexOf('<vBC>')).toBeLessThan(pis.indexOf('<pPIS>'));
      expect(pis.indexOf('<pPIS>')).toBeLessThan(pis.indexOf('<vPIS>'));
    });

    /// Fora do Simples as contribuições são efetivamente devidas, então o CST
    /// padrão não pode ser o mesmo — declarar 49 ali descreveria a operação
    /// errada.
    it('uses a different default CST outside Simples Nacional', () => {
      const out = buildNfeXml(
        baseInput({
          emitter: { ...baseInput().emitter, taxRegimeCode: '3' },
          items: [{ ...baseInput().items[0], csosn: undefined, cst: '00' }],
        }),
      ).xml.toString('utf-8');

      expect(out).toContain('<PISAliq><CST>01</CST>');
    });
  });

  /// `xNome` do emitente é limitado a 60 caracteres pelo leiaute. Razões sociais
  /// mais longas são comuns no Brasil — "RR EMPREENDIMENTOS E COMERCIO
  /// VAREJISTA DE MATERIAIS DE CONSTRUCAO LTDA" tem 71 — e sem truncar a
  /// empresa simplesmente **não consegue emitir**, com um erro de schema que
  /// não diz qual campo estourou.
  ///
  /// Truncar no builder, não no cadastro: a razão social é fato jurídico da
  /// empresa e não deve ser mutilada no nosso banco. O limite é do leiaute.
  describe('razão social longa', () => {
    const LONGA =
      'RR EMPREENDIMENTOS E COMERCIO VAREJISTA DE MATERIAIS DE CONSTRUCAO LTDA';

    it('truncates the emitter name to the 60 characters the layout allows', () => {
      const { xml } = buildNfeXml(
        baseInput({ emitter: { ...baseInput().emitter, legalName: LONGA } }),
      );
      const out = xml.toString('utf-8');
      const emitido = out.slice(out.indexOf('<emit>'), out.indexOf('</emit>'));
      const nome = /<xNome>([^<]*)<\/xNome>/.exec(emitido)?.[1] ?? '';

      expect(nome.length).toBeLessThanOrEqual(60);
      expect(LONGA.startsWith(nome)).toBe(true);
    });

    it('validates against the official schema with a long legal name', () => {
      const { xml } = buildNfeXml(
        baseInput({ emitter: { ...baseInput().emitter, legalName: LONGA } }),
      );
      // Assina antes de validar: o schema exige `Signature`, então XML não
      // assinado falharia por um motivo que nada tem a ver com o nome longo.
      const certFixture = buildSelfSignedCertificateFixture();
      const signedXml = signXml({
        xml: xml.toString(),
        privateKeyPem: certFixture.privateKeyPem,
        certificatePem: certFixture.certificatePem,
        referenceXPath: "//*[local-name(.)='infNFe']",
        signatureLocationXPath: "//*[local-name(.)='NFe']",
        algorithmProfile: 'NFE_SEFAZ',
      });

      expect(() =>
        assertValidXml(signedXml, NFE_XSD_PATH, 'razao-social-longa'),
      ).not.toThrow();
    });

    it('leaves a name within the limit untouched', () => {
      const { xml } = buildNfeXml(baseInput());
      expect(xml.toString('utf-8')).toContain(
        '<xNome>EMPRESA TESTE LTDA</xNome>',
      );
    });
  });
});

/// Apuração real de PIS/COFINS (spec erp/015). O comentário do builder registrava
/// que "apurar PIS/COFINS de verdade exige tabela de tributação por produto" — esta
/// feature entrega essa tabela e o builder passa a calcular. Estes testes provam o
/// XML transmitido (SC-003) e as duas não-regressões (SC-005/006).
describe('buildNfeXml — PIS/COFINS apurados (spec erp/015)', () => {
  /// Item de Regime Normal com PIS/COFINS já resolvidos pelo emissor.
  function regimeNormalInput(overrides: Partial<BuildNfeXmlInput> = {}) {
    return baseInput({
      emitter: { ...baseInput().emitter, taxRegimeCode: '3' },
      items: [
        {
          description: 'Produto Teste',
          ncm: '61091000',
          cfop: '5102',
          quantity: 1,
          unitValue: 1000,
          totalValue: 1000,
          cst: '00',
          pis: { cst: '01', aliquota: 1.65 },
          cofins: { cst: '01', aliquota: 7.6 },
        },
      ],
      ...overrides,
    });
  }

  it('emite PISAliq/COFINSAliq com pPIS/vPIS e pCOFINS/vCOFINS calculados sobre a base', () => {
    const xml = buildNfeXml(regimeNormalInput()).xml.toString('utf-8');
    expect(xml).toContain('<PISAliq>');
    expect(xml).toContain('<CST>01</CST>');
    expect(xml).toContain('<pPIS>1.6500</pPIS>');
    expect(xml).toContain('<vPIS>16.50</vPIS>');
    expect(xml).toContain('<COFINSAliq>');
    expect(xml).toContain('<pCOFINS>7.6000</pCOFINS>');
    expect(xml).toContain('<vCOFINS>76.00</vCOFINS>');
    // Não é mais o hardcode zerado.
    expect(xml).not.toContain('<vPIS>0.00</vPIS>');
  });

  it('soma os totais vPIS/vCOFINS dos itens', () => {
    const xml = buildNfeXml(
      regimeNormalInput({
        items: [
          {
            description: 'A',
            ncm: '61091000',
            cfop: '5102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            pis: { cst: '01', aliquota: 1.65 },
            cofins: { cst: '01', aliquota: 7.6 },
          },
          {
            description: 'B',
            ncm: '61091000',
            cfop: '5102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            pis: { cst: '01', aliquota: 1.65 },
            cofins: { cst: '01', aliquota: 7.6 },
          },
        ],
      }),
    ).xml.toString('utf-8');
    // Só o total tem 33.00 / 152.00 (cada item soma 16.50 / 76.00).
    expect(xml).toContain('<vPIS>33.00</vPIS>');
    expect(xml).toContain('<vCOFINS>152.00</vCOFINS>');
  });

  it('emite PISNT/COFINSNT sem valores para CST não tributado (04–09)', () => {
    const xml = buildNfeXml(
      regimeNormalInput({
        items: [
          {
            description: 'Monofásico',
            ncm: '22021000',
            cfop: '5102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            pis: { cst: '06' },
            cofins: { cst: '06' },
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(xml).toContain('<PISNT>');
    expect(xml).toContain('<COFINSNT>');
    expect(xml).toContain('<CST>06</CST>');
    expect(xml).not.toContain('<PISAliq>');
    // Sem tributação → total zerado.
    expect(xml).toContain('<vPIS>0.00</vPIS>');
  });

  it('NÃO-REGRESSÃO 1: Simples Nacional mantém PISOutr/COFINSOutr CST 49 zerado', () => {
    // baseInput() já é Simples (taxRegimeCode '1').
    const xml = buildNfeXml(baseInput()).xml.toString('utf-8');
    expect(xml).toContain('<PISOutr>');
    expect(xml).toContain('<COFINSOutr>');
    expect(xml).toContain('<CST>49</CST>');
    expect(xml).toContain('<vPIS>0.00</vPIS>');
    expect(xml).not.toContain('<PISAliq>');
  });

  it('NÃO-REGRESSÃO 2: Regime Normal sem grupo (sem pis/cofins) mantém CST 01 zerado', () => {
    const xml = buildNfeXml(
      regimeNormalInput({
        items: [
          {
            description: 'Sem grupo',
            ncm: '61091000',
            cfop: '5102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(xml).toContain('<PISAliq>');
    expect(xml).toContain('<CST>01</CST>');
    expect(xml).toContain('<vPIS>0.00</vPIS>');
  });
});

/// Apuração real de ICMS (spec erp/016 — fecha o bugfix B1). O builder emitia
/// ICMS00 com pICMS/vICMS 0.00 e orig '0' hardcoded; agora recebe a alíquota da UF
/// de destino (resolvida pelo emissor) e a origem, e calcula. Estes testes provam o
/// XML transmitido (SC-004) e a não-regressão do Simples (SC-006).
describe('buildNfeXml — ICMS apurado (spec erp/016)', () => {
  function regimeNormalIcms(overrides: Partial<BuildNfeXmlInput> = {}) {
    return baseInput({
      emitter: { ...baseInput().emitter, taxRegimeCode: '3' },
      items: [
        {
          description: 'Produto',
          ncm: '61091000',
          cfop: '5102',
          quantity: 1,
          unitValue: 1000,
          totalValue: 1000,
          cst: '00',
          icmsAliquota: 18,
          origem: '0',
        },
      ],
      ...overrides,
    });
  }

  it('emite ICMS00 com vBC/pICMS/vICMS calculados e orig real', () => {
    const xml = buildNfeXml(regimeNormalIcms()).xml.toString('utf-8');
    expect(xml).toContain('<ICMS00>');
    expect(xml).toContain('<orig>0</orig>');
    expect(xml).toContain('<vBC>1000.00</vBC>');
    expect(xml).toContain('<pICMS>18.00</pICMS>');
    expect(xml).toContain('<vICMS>180.00</vICMS>');
    // Totais do ICMSTot somam os itens (não mais 0.00).
    expect(xml).not.toContain('<vICMS>0.00</vICMS>');
  });

  it('respeita a alíquota da UF de destino (interestadual ≠ interna, não hardcoded)', () => {
    const xml = buildNfeXml(
      regimeNormalIcms({
        items: [
          {
            description: 'Produto',
            ncm: '61091000',
            cfop: '6102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            icmsAliquota: 12,
            origem: '0',
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(xml).toContain('<pICMS>12.00</pICMS>');
    expect(xml).toContain('<vICMS>120.00</vICMS>');
  });

  it('emite a origem real da mercadoria (orig ≠ 0 fixo)', () => {
    const xml = buildNfeXml(
      regimeNormalIcms({
        items: [
          {
            description: 'Importado',
            ncm: '61091000',
            cfop: '5102',
            quantity: 1,
            unitValue: 500,
            totalValue: 500,
            cst: '00',
            icmsAliquota: 18,
            origem: '2',
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(xml).toContain('<orig>2</orig>');
  });

  it('NÃO-REGRESSÃO: Simples Nacional mantém ICMSSN sem alíquota', () => {
    // baseInput() é Simples (taxRegimeCode '1', csosn '102').
    const xml = buildNfeXml(baseInput()).xml.toString('utf-8');
    expect(xml).toContain('<ICMSSN102>');
    expect(xml).not.toContain('<ICMS00>');
    expect(xml).not.toContain('<pICMS>');
  });

  it('NÃO-REGRESSÃO: Regime Normal sem grupo mantém ICMS00 zerado', () => {
    const xml = buildNfeXml(
      regimeNormalIcms({
        items: [
          {
            description: 'Sem grupo',
            ncm: '61091000',
            cfop: '5102',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(xml).toContain('<ICMS00>');
    expect(xml).toContain('<pICMS>0.00</pICMS>');
    expect(xml).toContain('<vICMS>0.00</vICMS>');
  });
});

/// Grupo infAdic (spec erp/017). Textos adicionais já resolvidos pelo emissor entram
/// em infAdFisco (interesse do fisco) e infCpl (interesse do contribuinte), na ordem
/// do XSD. Sem texto → grupo omitido (não-regressão). Cobre NF-e e NFC-e (mesmo builder).
describe('buildNfeXml — infAdic (spec erp/017)', () => {
  it('emite infAdic com infAdFisco e infCpl no campo certo, e valida no XSD', () => {
    const { xml, accessKey } = buildNfeXml(
      baseInput({
        additionalInfo: {
          infAdFisco:
            'Documento emitido por ME/EPP optante pelo Simples Nacional.',
          infCpl: 'Pedido 12345. Obrigado pela preferencia.',
        },
      }),
    );
    const text = xml.toString('utf-8');
    expect(text).toContain('<infAdic>');
    expect(text).toContain(
      '<infAdFisco>Documento emitido por ME/EPP optante pelo Simples Nacional.</infAdFisco>',
    );
    expect(text).toContain(
      '<infCpl>Pedido 12345. Obrigado pela preferencia.</infCpl>',
    );
    // Ordem do XSD: infAdFisco antes de infCpl.
    expect(text.indexOf('<infAdFisco>')).toBeLessThan(text.indexOf('<infCpl>'));
    expect(accessKey).toHaveLength(44);
    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });
    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'infadic'),
    ).not.toThrow();
  });

  it('emite apenas infCpl quando só ele é informado', () => {
    const text = buildNfeXml(
      baseInput({ additionalInfo: { infCpl: 'Só contribuinte.' } }),
    ).xml.toString('utf-8');
    expect(text).toContain('<infCpl>Só contribuinte.</infCpl>');
    expect(text).not.toContain('<infAdFisco>');
  });

  it('NÃO-REGRESSÃO: sem additionalInfo não emite infAdic', () => {
    const text = buildNfeXml(baseInput()).xml.toString('utf-8');
    expect(text).not.toContain('<infAdic>');
  });

  it('impede infAdFisco acima do teto do XSD (2000)', () => {
    expect(() =>
      buildNfeXml(
        baseInput({ additionalInfo: { infAdFisco: 'x'.repeat(2001) } }),
      ),
    ).toThrow(/infAdFisco/);
  });

  it('escapa caracteres especiais de XML (< > & ") em vez de injetar', () => {
    // Trava a defesa contra injeção estrutural: o texto NÃO pode abrir tags.
    const text = buildNfeXml(
      baseInput({
        additionalInfo: { infCpl: 'A < B & C > D "aspas" </infCpl>' },
      }),
    ).xml.toString('utf-8');
    expect(text).toContain(
      '<infCpl>A &lt; B &amp; C &gt; D "aspas" &lt;/infCpl&gt;</infCpl>',
    );
  });

  it('impede caractere de controle ilegal em XML 1.0 no infCpl', () => {
    // U+0007 (bell) deixaria o documento transmitido mal-formado.
    const bell = String.fromCharCode(7);
    expect(() =>
      buildNfeXml(
        baseInput({ additionalInfo: { infCpl: `antes${bell}depois` } }),
      ),
    ).toThrow(/controle/i);
  });
});

/// Bloco IPI na NF-e (spec erp/019). O builder emitia `vIPI: 0.00` fixo e nunca o
/// grupo `IPI` do item; agora recebe o IPI resolvido pelo emissor (grupo → CST +
/// cEnq + alíquota) e monta `IPITrib` (50/99) ou `IPINT` (51–55). Estes testes
/// provam o XML transmitido (SC-003/004) e a não-regressão (SC-005): item sem IPI
/// continua sem bloco e com o total zerado.
describe('buildNfeXml — bloco IPI (spec erp/019)', () => {
  /// Item de Regime Normal com IPI já resolvido pelo emissor. IPI é federal —
  /// vale nos dois regimes —, mas usamos Regime Normal para o item carregar
  /// ICMS00/PIS/COFINS reais e validar o `imposto` completo contra o XSD.
  function ipiInput(overrides: Partial<BuildNfeXmlInput> = {}) {
    return baseInput({
      emitter: { ...baseInput().emitter, taxRegimeCode: '3' },
      items: [
        {
          description: 'Produto Industrializado',
          ncm: '61091000',
          cfop: '5101',
          quantity: 1,
          unitValue: 1000,
          totalValue: 1000,
          cst: '00',
          icmsAliquota: 18,
          origem: '0',
          pis: { cst: '01', aliquota: 1.65 },
          cofins: { cst: '01', aliquota: 7.6 },
          ipi: { cst: '50', cEnq: '999', aliquota: 10 },
        },
      ],
      ...overrides,
    });
  }

  it('emite IPI/cEnq + IPITrib (vBC/pIPI/vIPI) para CST 50 e valida no XSD', () => {
    const { xml, accessKey } = buildNfeXml(ipiInput());
    const out = xml.toString('utf-8');
    expect(out).toContain('<IPI><cEnq>999</cEnq>');
    expect(out).toContain('<IPITrib>');
    expect(out).toContain('<CST>50</CST>');
    expect(out).toContain('<vBC>1000.00</vBC>');
    expect(out).toContain('<pIPI>10.0000</pIPI>');
    expect(out).toContain('<vIPI>100.00</vIPI>');
    // Total do IPI soma o item (não mais 0.00 fixo).
    const total = out.slice(out.indexOf('<total>'), out.indexOf('</total>'));
    expect(total).toContain('<vIPI>100.00</vIPI>');
    // IPI é "por fora": entra no vNF (1000 produto + 100 IPI).
    expect(total).toContain('<vNF>1100.00</vNF>');

    // Assina e valida contra o schema oficial — prova a sequência do `imposto`
    // (ICMS → IPI → PIS/COFINS) e a estrutura TIpi.
    expect(accessKey).toHaveLength(44);
    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });
    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'ipi-tributado'),
    ).not.toThrow();
  });

  it('respeita a sequência do XSD: IPI entre ICMS e PIS no imposto', () => {
    const out = buildNfeXml(ipiInput()).xml.toString('utf-8');
    const imposto = out.slice(
      out.indexOf('<imposto>'),
      out.indexOf('</imposto>'),
    );
    expect(imposto.indexOf('<ICMS>')).toBeLessThan(imposto.indexOf('<IPI>'));
    expect(imposto.indexOf('<IPI>')).toBeLessThan(imposto.indexOf('<PIS>'));
  });

  it('emite IPINT (sem valores) para CST não tributado (53) e valida no XSD', () => {
    const { xml } = buildNfeXml(
      ipiInput({
        items: [
          {
            description: 'Produto Não Tributado',
            ncm: '61091000',
            cfop: '5101',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            icmsAliquota: 18,
            origem: '0',
            pis: { cst: '01', aliquota: 1.65 },
            cofins: { cst: '01', aliquota: 7.6 },
            ipi: { cst: '53', cEnq: '999' },
          },
        ],
      }),
    );
    const out = xml.toString('utf-8');
    expect(out).toContain('<IPI><cEnq>999</cEnq><IPINT><CST>53</CST></IPINT>');
    // IPINT não tem vBC/pIPI/vIPI; o total do IPI não soma este item.
    const total = out.slice(out.indexOf('<total>'), out.indexOf('</total>'));
    expect(total).toContain('<vIPI>0.00</vIPI>');
    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });
    expect(() =>
      assertValidXml(signedXml, NFE_XSD_PATH, 'ipi-nao-tributado'),
    ).not.toThrow();
  });

  it('trata CST 99 (outras saídas) como tributado — IPITrib com valores', () => {
    const out = buildNfeXml(
      ipiInput({
        items: [
          {
            ...ipiInput().items[0],
            ipi: { cst: '99', cEnq: '999', aliquota: 5 },
          },
        ],
      }),
    ).xml.toString('utf-8');
    expect(out).toContain('<IPITrib><CST>99</CST>');
    expect(out).toContain('<pIPI>5.0000</pIPI>');
    expect(out).toContain('<vIPI>50.00</vIPI>');
  });

  it('soma o total vIPI apenas dos itens tributados (mistura 50 + 53)', () => {
    const out = buildNfeXml(
      ipiInput({
        items: [
          {
            description: 'Tributado',
            ncm: '61091000',
            cfop: '5101',
            quantity: 1,
            unitValue: 1000,
            totalValue: 1000,
            cst: '00',
            icmsAliquota: 18,
            origem: '0',
            pis: { cst: '01', aliquota: 1.65 },
            cofins: { cst: '01', aliquota: 7.6 },
            ipi: { cst: '50', cEnq: '999', aliquota: 10 },
          },
          {
            description: 'Isento',
            ncm: '61091000',
            cfop: '5101',
            quantity: 1,
            unitValue: 500,
            totalValue: 500,
            cst: '00',
            icmsAliquota: 18,
            origem: '0',
            pis: { cst: '01', aliquota: 1.65 },
            cofins: { cst: '01', aliquota: 7.6 },
            ipi: { cst: '52', cEnq: '999' },
          },
        ],
      }),
    ).xml.toString('utf-8');
    const total = out.slice(out.indexOf('<total>'), out.indexOf('</total>'));
    // Só o item CST 50 soma (100.00); o CST 52 (isento) não.
    expect(total).toContain('<vIPI>100.00</vIPI>');
    // vNF = 1000 + 500 + 100 de IPI.
    expect(total).toContain('<vNF>1600.00</vNF>');
  });

  it('NÃO-REGRESSÃO (SC-005): item sem grupo de IPI não emite bloco IPI e mantém vIPI 0.00', () => {
    // baseInput() é Simples e não traz `ipi` no item — o caso comum.
    const out = buildNfeXml(baseInput()).xml.toString('utf-8');
    expect(out).not.toContain('<IPI>');
    expect(out).not.toContain('<IPITrib>');
    expect(out).not.toContain('<IPINT>');
    const total = out.slice(out.indexOf('<total>'), out.indexOf('</total>'));
    expect(total).toContain('<vIPI>0.00</vIPI>');
    // vNF inalterado (só produtos).
    expect(total).toContain('<vNF>850.00</vNF>');
  });
});
