import { readNfseXml } from './nfse-xml.reader';
import {
  buildAuthorizedNfseXml,
  buildAuthorizedNfseXmlFull,
} from '../../tests/fixtures/authorized-nfse-xml';

/// FR-011 (spec 029) — o reader precisa extrair TODOS os campos que a NT
/// 008/2026 exige no DANFSE, e distinguir "ausente" de "zero". Dois eixos:
///
/// - **presença** (fixture cheia): cada grupo da NT populado vira campo lido.
/// - **omissão** (fixture mínima): grupo ausente vira `undefined`, nunca `0`
///   ou `''` sintético — a regra que impede o documento de afirmar retenção/
///   endereço/intermediário onde a nota não os tem.

describe('readNfseXml', () => {
  describe('presença — XML completo (NT 008/2026)', () => {
    const data = readNfseXml(Buffer.from(buildAuthorizedNfseXmlFull().xml));

    it('lê chave, número, data e município', () => {
      expect(data.accessKey).toBe(
        '29136062250031609000104000000000002026080715989993',
      );
      expect(data.nfseNumber).toBe('42');
      expect(data.issuedAt).toBe('2026-08-07T12:00:05-03:00');
      expect(data.cityName).toBe('Ilhéus');
    });

    it('lê o prestador com endereço e inscrição municipal', () => {
      expect(data.provider.cnpj).toBe('50031609000104');
      expect(data.provider.legalName).toContain('RR EMPREENDIMENTOS');
      expect(data.provider.municipalRegistration).toBe('123456');
      expect(data.provider.address).toMatchObject({
        street: 'Rua Marques de Paranagua',
        number: '100',
        district: 'Centro',
        uf: 'BA',
        zipCode: '45650000',
      });
    });

    it('lê o tomador com endereço', () => {
      expect(data.customer.document).toBe('13937073000156');
      expect(data.customer.name).toContain('TOMADOR DE HOMOLOGAÇÃO');
      expect(data.customer.address).toMatchObject({
        street: 'Avenida Sete de Setembro',
        number: '200',
        district: 'Comercio',
        zipCode: '40010000',
      });
    });

    it('lê o intermediário quando presente', () => {
      expect(data.intermediary).toEqual({
        document: '19131243000197',
        name: 'INTERMEDIARIO DE PAGAMENTO SA',
      });
    });

    it('lê o serviço com código nacional, municipal e local da prestação', () => {
      expect(data.service.description).toContain('instalação predial');
      expect(data.service.nationalCode).toBe('070201');
      expect(data.service.municipalCode).toBe('0702');
      expect(data.service.provisionCity).toBe('Ilhéus');
      expect(data.service.totalValue).toBe(1500);
      expect(data.service.issRate).toBe(2);
      expect(data.service.issWithheld).toBe(true);
    });

    it('lê os valores calculados pelo Sefin (BC, ISSQN, líquido)', () => {
      expect(data.service.issValue).toBe(29);
      expect(data.amounts.calculationBase).toBe(1450);
      expect(data.amounts.deductions).toBe(50);
      expect(data.amounts.discounts).toBe(50);
      expect(data.amounts.netValue).toBe(1182.5);
    });

    it('lê as retenções federais', () => {
      expect(data.federalTaxes).toEqual({
        pis: 9.75,
        cofins: 45,
        inss: 165,
        irrf: 22.5,
        csll: 13.5,
      });
    });

    it('lê os totalizadores de tributos', () => {
      // vTotTribFed (90.75) + vTotTribEst (0) + vTotTribMun (29) = 119.75
      expect(data.totals?.totalTaxes).toBeCloseTo(119.75, 2);
    });
  });

  describe('omissão — XML mínimo (sem zeros falsos)', () => {
    const data = readNfseXml(Buffer.from(buildAuthorizedNfseXml().xml));

    it('mantém prestador com endereço (vem do emit) mas omite o resto', () => {
      expect(data.provider.address?.street).toBe('Rua Marques de Paranagua');
    });

    it('omite endereço do tomador quando ausente', () => {
      expect(data.customer.address).toBeUndefined();
    });

    it('omite o intermediário quando ausente', () => {
      expect(data.intermediary).toBeUndefined();
    });

    it('omite retenções federais quando o grupo não existe', () => {
      expect(data.federalTaxes).toBeUndefined();
    });

    it('omite base de cálculo, deduções e descontos ausentes (não zera)', () => {
      expect(data.amounts.calculationBase).toBeUndefined();
      expect(data.amounts.discounts).toBeUndefined();
      // Ausente no XML mínimo → undefined, nunca 0 sintético (R3).
      expect(data.amounts.deductions).toBeUndefined();
    });

    it('usa vLiq do infNFSe como valor líquido', () => {
      expect(data.amounts.netValue).toBe(1500);
    });

    it('não marca ISS como retido quando tpRetISSQN ausente', () => {
      expect(data.service.issWithheld).toBe(false);
    });
  });

  /// `totTrib` é um `xs:choice` de quatro variantes (valor, percentual por
  /// esfera, indicador "0" e percentual único do Simples). Cada uma precisa de
  /// leitura própria — a percentual e a do Simples eram silenciosamente
  /// ignoradas antes.
  describe('totTrib — todas as variantes do choice', () => {
    function readTotalsFrom(totTribInner: string) {
      const xml = [
        '<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse">',
        '<infNFSe Id="NFS29136062250031609000104000000000002026080715989993">',
        '<DPS><infDPS><valores><trib>',
        `<totTrib>${totTribInner}</totTrib>`,
        '</trib></valores></infDPS></DPS>',
        '</infNFSe></NFSe>',
      ].join('');
      return readNfseXml(Buffer.from(xml)).totals;
    }

    it('lê a variante de VALOR (vTotTrib) somando as esferas', () => {
      const totals = readTotalsFrom(
        '<vTotTrib><vTotTribFed>90.75</vTotTribFed><vTotTribEst>0.00</vTotTribEst><vTotTribMun>29.00</vTotTribMun></vTotTrib>',
      );
      expect(totals?.totalTaxes).toBeCloseTo(119.75, 2);
    });

    it('lê a variante PERCENTUAL por esfera (pTotTrib, um GRUPO — não escalar)', () => {
      const totals = readTotalsFrom(
        '<pTotTrib><pTotTribFed>6.00</pTotTribFed><pTotTribEst>0.00</pTotTribEst><pTotTribMun>2.00</pTotTribMun></pTotTrib>',
      );
      expect(totals?.approxTaxPercent).toBeCloseTo(8.0, 2);
    });

    it('lê o percentual único do Simples Nacional (pTotTribSN)', () => {
      const totals = readTotalsFrom('<pTotTribSN>6.00</pTotTribSN>');
      expect(totals?.approxTaxPercent).toBeCloseTo(6.0, 2);
    });

    it('omite a seção quando indTotTrib=0 (não informar)', () => {
      const totals = readTotalsFrom('<indTotTrib>0</indTotTrib>');
      expect(totals).toBeUndefined();
    });
  });
});
