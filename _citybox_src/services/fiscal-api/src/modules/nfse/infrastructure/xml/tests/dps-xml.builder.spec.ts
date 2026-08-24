import { buildDpsXml, type BuildDpsXmlInput } from '../dps-xml.builder';
import { NFSE_DPS_XSD_PATH } from '../nfse-xsd-path';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { buildSelfSignedCertificateFixture } from '../../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';

function baseInput(
  overrides: Partial<BuildDpsXmlInput> = {},
): BuildDpsXmlInput {
  return {
    environment: 'HOMOLOGATION',
    provider: {
      cnpj: '11222333000181',
      municipalRegistration: '123456',
      legalName: 'EMPRESA TESTE LTDA',
      cityCodeIbge: '2913606',
      simplesNacionalOption: '3',
    },
    customer: {
      documentType: 'CPF',
      document: '12345678900',
      name: 'Cliente Teste',
    },
    service: {
      description: 'Serviço de consultoria em tecnologia da informação',
      municipalServiceCode: '17.02',
      issRate: 5,
      issWithheld: false,
      totalValue: 850,
    },
    series: '1',
    number: '1',
    emissionDate: new Date(),
    ...overrides,
  };
}

describe('buildDpsXml + signXml (pipeline completo contra o schema oficial)', () => {
  it('produces a signed DPS XML that validates against the real DPS_v1.01.xsd', () => {
    const { xml, dpsId } = buildDpsXml(baseInput());
    expect(dpsId).toHaveLength(45);
    expect(dpsId).toMatch(/^DPS[0-9]{42}$/);

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infDPS']",
      signatureLocationXPath: "//*[local-name(.)='DPS']",
      algorithmProfile: 'MODERN',
    });

    expect(() =>
      assertValidXml(signedXml, NFSE_DPS_XSD_PATH, 'dps-xml.builder.spec'),
    ).not.toThrow();
  });

  it('produces a valid DPS for a CNPJ customer with issWithheld=true and no issRate', () => {
    const { xml } = buildDpsXml(
      baseInput({
        customer: {
          documentType: 'CNPJ',
          document: '99888777000166',
          name: 'Cliente PJ Teste',
        },
        service: {
          description: 'Serviço com retenção de ISS pelo tomador',
          municipalServiceCode: '01.05',
          issWithheld: true,
          totalValue: 1200,
        },
      }),
    );

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infDPS']",
      signatureLocationXPath: "//*[local-name(.)='DPS']",
      algorithmProfile: 'MODERN',
    });

    expect(() =>
      assertValidXml(signedXml, NFSE_DPS_XSD_PATH, 'dps-xml.builder.spec'),
    ).not.toThrow();
    expect(xml.toString()).toContain('<tpRetISSQN>2</tpRetISSQN>');
  });

  it('produces a different dpsId for a different series/number', () => {
    const first = buildDpsXml(baseInput({ series: '1', number: '1' }));
    const second = buildDpsXml(baseInput({ series: '1', number: '2' }));

    expect(first.dpsId).not.toBe(second.dpsId);
  });
});

/// O Sefin Nacional rejeitou `010600` com `E0310` — "o código de tributação
/// nacional informado não existe conforme a lista de serviços nacional"
/// (verificado em produção restrita, 2026-08-06). Derivar o cTribNac do código
/// municipal concatenando "00" era best-effort e não vale: os dois códigos são
/// tabelas distintas. Quem chama precisa poder informar o nacional.
describe('cTribNac explícito', () => {
  it('uses the national code when the caller provides it', () => {
    const { xml } = buildDpsXml(
      baseInput({
        service: {
          ...baseInput().service,
          municipalServiceCode: '01.06',
          nationalServiceCode: '010602',
        },
      }),
    );

    expect(xml.toString()).toContain('<cTribNac>010602</cTribNac>');
  });

  it('falls back to deriving it from the municipal code when absent', () => {
    const { xml } = buildDpsXml(
      baseInput({
        service: { ...baseInput().service, municipalServiceCode: '01.06' },
      }),
    );

    expect(xml.toString()).toContain('<cTribNac>010600</cTribNac>');
  });

  /// `E0121` — "O nome ou razão social do prestador não deve ser informado
  /// quando o emitente da DPS for o próprio prestador".
  ///
  /// Com `tpEmit=1` o emitente É o prestador, e o Sefin já sabe a razão social
  /// pelo CNPJ: mandá-la é rejeição. Verificado contra o serviço real em
  /// 2026-08-07.
  describe('razão social do prestador', () => {
    it('omits xNome from prest because the emitter is the provider', () => {
      const { xml } = buildDpsXml(baseInput());
      const out = xml.toString('utf-8');
      const prest = out.slice(out.indexOf('<prest>'), out.indexOf('</prest>'));

      expect(prest).not.toContain('<xNome>');
    });

    /// O tomador continua com nome — a regra é só do prestador.
    it('keeps the customer name', () => {
      const { xml } = buildDpsXml(baseInput());
      const out = xml.toString('utf-8');
      const toma = out.slice(out.indexOf('<toma>'), out.indexOf('</toma>'));

      expect(toma).toContain('<xNome>');
    });
  });

  /// `E0166` — "É obrigatório o preenchimento do campo de regime de apuração dos
  /// tributos do SN". O XSD marca `regApTribSN` como `minOccurs="0"`, mas o
  /// Sefin o **exige** quando `opSimpNac = 3` (optante ME/EPP). Verificado
  /// contra o serviço real em 2026-08-07.
  describe('regime de apuração do Simples Nacional', () => {
    it('emits regApTribSN for a Simples Nacional ME/EPP provider', () => {
      const { xml } = buildDpsXml(baseInput());
      const out = xml.toString('utf-8');

      expect(out).toContain('<opSimpNac>3</opSimpNac>');
      // 1 = tributos federais E municipal pelo SN, que é o caso comum de quem
      // não ultrapassou sublimite.
      expect(out).toContain('<regApTribSN>1</regApTribSN>');
    });

    /// Quem não é optante não tem regime de apuração do SN — mandar o campo
    /// descreveria um enquadramento que a empresa não tem.
    it('omits regApTribSN for a provider outside Simples Nacional', () => {
      const base = baseInput();
      const { xml } = buildDpsXml({
        ...base,
        provider: { ...base.provider, simplesNacionalOption: '1' },
      });

      expect(xml.toString('utf-8')).not.toContain('regApTribSN');
    });
  });

  /// `E0625` — "Não é permitido informar alíquota quando não há indicação de
  /// retenção do ISSQN (tpRetISSQN = 1)". Sem retenção, quem define a alíquota
  /// é o município: declará-la é rejeição. Verificado contra o serviço real em
  /// 2026-08-07.
  describe('alíquota do ISSQN', () => {
    it('omits pAliq when the ISS is not withheld', () => {
      const base = baseInput();
      const { xml } = buildDpsXml({
        ...base,
        service: { ...base.service, issRate: 5, issWithheld: false },
      });

      const out = xml.toString('utf-8');
      expect(out).toContain('<tpRetISSQN>1</tpRetISSQN>');
      expect(out).not.toContain('pAliq');
    });

    it('keeps pAliq when the ISS is withheld', () => {
      const base = baseInput();
      const { xml } = buildDpsXml({
        ...base,
        service: { ...base.service, issRate: 5, issWithheld: true },
      });

      const out = xml.toString('utf-8');
      expect(out).toContain('<tpRetISSQN>2</tpRetISSQN>');
      expect(out).toContain('<pAliq>5.00</pAliq>');
    });
  });

  /// `tribISSQN` (spec erp/018) deixou de ser fixo '1' — vem do Grupo de ISSQN
  /// resolvido pelo emissor. Default '1' quando o caller não informa (não-regressão).
  describe('tribISSQN (exigibilidade do ISS)', () => {
    it('emite tribISSQN=1 (tributável) por padrão, sem o campo (não-regressão)', () => {
      const out = buildDpsXml(baseInput()).xml.toString('utf-8');
      expect(out).toContain('<tribISSQN>1</tribISSQN>');
    });

    it.each(['1', '2', '4'] as const)(
      'emite o tribISSQN=%s vindo do serviço',
      (trib) => {
        const base = baseInput();
        const out = buildDpsXml({
          ...base,
          service: { ...base.service, tribISSQN: trib },
        }).xml.toString('utf-8');
        expect(out).toContain(`<tribISSQN>${trib}</tribISSQN>`);
      },
    );

    it('NÃO-REGRESSÃO: imunidade (2) sem retenção continua sem pAliq', () => {
      const base = baseInput();
      const out = buildDpsXml({
        ...base,
        service: {
          ...base.service,
          tribISSQN: '2',
          issRate: 5,
          issWithheld: false,
        },
      }).xml.toString('utf-8');
      expect(out).toContain('<tribISSQN>2</tribISSQN>');
      expect(out).not.toContain('pAliq');
    });
  });

  /// `E0712` — "Para ME/EPP o indicador de informação de valor total de tributos
  /// não pode ser informado". Optante do Simples não declara transparência
  /// tributária (Lei 12.741/2012): o tributo dele sai no DAS. Verificado contra
  /// o serviço real em 2026-08-07.
  describe('indicador de total de tributos', () => {
    it('uses vTotTrib instead of the forbidden indicator for ME/EPP', () => {
      const out = buildDpsXml(baseInput()).xml.toString('utf-8');

      // O indicador é proibido para ME/EPP; o grupo em si é obrigatório pelo
      // schema, então a saída é o valor decomposto.
      expect(out).not.toContain('indTotTrib');
      expect(out).toContain('<vTotTribFed>0.00</vTotTribFed>');
    });

    it('keeps totTrib outside Simples Nacional', () => {
      const base = baseInput();
      const { xml } = buildDpsXml({
        ...base,
        provider: { ...base.provider, simplesNacionalOption: '1' },
      });

      expect(xml.toString('utf-8')).toContain('<indTotTrib>0</indTotTrib>');
    });
  });

  /// ⚠️ Descoberta contra o serviço real (2026-08-07): substituição de NFS-e
  /// **não é um evento postado**. O `e105102` não é aceito por
  /// `POST /nfse/{chave}/eventos` — rejeição `E1861`.
  ///
  /// O caminho correto é emitir uma DPS com o bloco `subst`, e o Sefin gera o
  /// evento de cancelamento por substituição sozinho.
  describe('bloco de substituição', () => {
    const CHAVE_SUBSTITUIDA = '2'.repeat(50);

    it('emits subst with the substituted note key and reason', () => {
      const base = baseInput();
      const { xml } = buildDpsXml({
        ...base,
        substitution: {
          substitutedAccessKey: CHAVE_SUBSTITUIDA,
          reasonCode: '05',
          reasonText: 'Rejeicao da nota pelo tomador do servico prestado',
        },
      });
      const out = xml.toString('utf-8');

      expect(out).toContain(`<chSubstda>${CHAVE_SUBSTITUIDA}</chSubstda>`);
      expect(out).toContain('<cMotivo>05</cMotivo>');
    });

    /// `xs:sequence`: `subst` vem entre `cLocEmi` e `prest`. Fora de ordem o
    /// XML é recusado por schema antes de chegar à regra de negócio.
    it('places subst between cLocEmi and prest', () => {
      const base = baseInput();
      const out = buildDpsXml({
        ...base,
        substitution: {
          substitutedAccessKey: CHAVE_SUBSTITUIDA,
          reasonCode: '05',
        },
      }).xml.toString('utf-8');

      expect(out.indexOf('<cLocEmi>')).toBeLessThan(out.indexOf('<subst>'));
      expect(out.indexOf('<subst>')).toBeLessThan(out.indexOf('<prest>'));
    });

    it('omits subst entirely on a normal emission', () => {
      expect(buildDpsXml(baseInput()).xml.toString('utf-8')).not.toContain(
        '<subst>',
      );
    });
  });
});

/// Informação complementar da DPS (spec erp/017, plan D10). A NFS-e nacional NÃO tem
/// infAdic/infAdFisco — só serv/infoCompl/xInfComp (análogo do infCpl). Sem texto →
/// infoCompl omitido (não-regressão).
describe('buildDpsXml — infoCompl/xInfComp (spec erp/017)', () => {
  it('emite serv/infoCompl/xInfComp e valida no XSD', () => {
    const { xml } = buildDpsXml(
      baseInput({
        additionalInfo: {
          infCpl: 'Serviço prestado conforme contrato 42/2026.',
        },
      }),
    );
    const text = xml.toString('utf-8');
    expect(text).toContain('<infoCompl>');
    expect(text).toContain(
      '<xInfComp>Serviço prestado conforme contrato 42/2026.</xInfComp>',
    );

    const certFixture = buildSelfSignedCertificateFixture();
    const signedXml = signXml({
      xml: xml.toString(),
      privateKeyPem: certFixture.privateKeyPem,
      certificatePem: certFixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infDPS']",
      signatureLocationXPath: "//*[local-name(.)='DPS']",
      algorithmProfile: 'MODERN',
    });
    expect(() =>
      assertValidXml(signedXml, NFSE_DPS_XSD_PATH, 'dps-infocompl'),
    ).not.toThrow();
  });

  it('NÃO-REGRESSÃO: sem additionalInfo não emite infoCompl', () => {
    expect(buildDpsXml(baseInput()).xml.toString('utf-8')).not.toContain(
      '<infoCompl>',
    );
  });

  it('impede xInfComp acima do teto do XSD (2000)', () => {
    expect(() =>
      buildDpsXml(baseInput({ additionalInfo: { infCpl: 'x'.repeat(2001) } })),
    ).toThrow(/xInfComp/);
  });

  it('escapa caracteres especiais de XML (< > &) no xInfComp', () => {
    const text = buildDpsXml(
      baseInput({ additionalInfo: { infCpl: 'A < B & C > D </xInfComp>' } }),
    ).xml.toString('utf-8');
    expect(text).toContain(
      '<xInfComp>A &lt; B &amp; C &gt; D &lt;/xInfComp&gt;</xInfComp>',
    );
  });

  it('impede caractere de controle ilegal em XML 1.0 no xInfComp', () => {
    const bell = String.fromCharCode(7);
    expect(() =>
      buildDpsXml(
        baseInput({ additionalInfo: { infCpl: `antes${bell}depois` } }),
      ),
    ).toThrow(/controle/i);
  });
});
