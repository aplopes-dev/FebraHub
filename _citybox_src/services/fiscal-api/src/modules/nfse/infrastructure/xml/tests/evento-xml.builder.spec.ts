import { validateXmlAgainstXsd } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { buildEventoXml } from '../evento-xml.builder';
import { NFSE_PED_REG_EVENTO_XSD_PATH } from '../nfse-xsd-path';

/// T025 — pedido de registro de evento (cancelamento `e101101` e solicitação de
/// análise fiscal `e101103`).
///
/// A asserção que vale é a validação contra `pedRegEvento_v1.01.xsd`: o órgão
/// fiscal rejeita por schema antes de olhar a regra de negócio, e conferir o
/// XML contra a minha leitura do XSD só provaria que li de forma consistente.
const baseInput = {
  environment: 'HOMOLOGATION' as const,
  authorAtDocument: {
    documentType: 'CNPJ' as const,
    document: '36698609000123',
  },
  nfseAccessKey: '29136062366986090001230000100000000000000000000005',
  reasonCode: '1' as const,
  reasonText: 'Erro no preenchimento do pedido original do cliente',
};

describe('buildEventoXml', () => {
  it('builds a cancel (e101101) request that validates against the official XSD', () => {
    const { xml } = buildEventoXml({ ...baseInput, kind: 'CANCEL' });

    const result = validateXmlAgainstXsd(xml, NFSE_PED_REG_EVENTO_XSD_PATH);
    expect(result.valid).toBe(true);
    expect(xml.toString('utf-8')).toContain(
      '<xDesc>Cancelamento de NFS-e</xDesc>',
    );
  });

  it('builds a fiscal-analysis (e101103) request that validates against the official XSD', () => {
    const { xml } = buildEventoXml({ ...baseInput, kind: 'FISCAL_ANALYSIS' });

    const result = validateXmlAgainstXsd(xml, NFSE_PED_REG_EVENTO_XSD_PATH);
    expect(result.valid).toBe(true);
    expect(xml.toString('utf-8')).toContain(
      '<xDesc>Solicitação de Análise Fiscal para Cancelamento de NFS-e</xDesc>',
    );
  });

  /// `TSIdPedRegEvt` é `PRE[0-9]{56}` — "PRE" + chave(50) + tipo do evento(6) +
  /// número do pedido(3). Um Id fora desse formato é recusado por schema, e o
  /// erro não diria qual das três partes está errada.
  it('composes the Id as PRE + access key + event type, matching the enforced pattern', () => {
    const { xml, eventId } = buildEventoXml({ ...baseInput, kind: 'CANCEL' });

    expect(eventId).toMatch(/^PRE[0-9]{56}$/);
    expect(eventId).toBe(`PRE${baseInput.nfseAccessKey}101101`);
    expect(xml.toString('utf-8')).toContain(`Id="${eventId}"`);
  });

  it('emits the environment code the caller asked for, not a default', () => {
    const homolog = buildEventoXml({ ...baseInput, kind: 'CANCEL' });
    expect(homolog.xml.toString('utf-8')).toContain('<tpAmb>2</tpAmb>');

    const production = buildEventoXml({
      ...baseInput,
      environment: 'PRODUCTION',
      kind: 'CANCEL',
    });
    expect(production.xml.toString('utf-8')).toContain('<tpAmb>1</tpAmb>');
  });

  /// `e105102` não é o mesmo formato dos outros dois: carrega `chSubstituta`
  /// (a chave da nota que substitui) e usa uma lista de motivos própria
  /// (`TSCodJustSubst`, códigos de dois dígitos). A ordem dos elementos importa
  /// — `xs:sequence`, não `xs:all`.
  it('builds a substitution (e105102) request that validates against the official XSD', () => {
    const { xml } = buildEventoXml({
      ...baseInput,
      kind: 'SUBSTITUTION',
      reasonCode: '05',
      substituteAccessKey: '29136062366986090001230000100000000000000000000006',
    });

    const result = validateXmlAgainstXsd(xml, NFSE_PED_REG_EVENTO_XSD_PATH);
    expect(result.valid).toBe(true);
    expect(xml.toString('utf-8')).toContain(
      '<xDesc>Cancelamento de NFS-e por Substituição</xDesc>',
    );
    expect(xml.toString('utf-8')).toContain(
      '<chSubstituta>29136062366986090001230000100000000000000000000006</chSubstituta>',
    );
  });

  /// Sem a chave da substituta o evento não tem sentido: é ela que diz qual
  /// nota assume o lugar. Falhar aqui é melhor que montar um XML que o órgão
  /// recusa por schema.
  it('refuses a substitution without the substituting note key', () => {
    expect(() =>
      buildEventoXml({ ...baseInput, kind: 'SUBSTITUTION', reasonCode: '05' }),
    ).toThrow(/substitut/i);
  });

  /// `TSMotivo` exige 15–255 caracteres. Deixar passar um texto curto trocaria
  /// uma falha local e legível por uma rejeição do órgão fiscal.
  it('refuses a reason text shorter than the schema minimum', () => {
    expect(() =>
      buildEventoXml({ ...baseInput, kind: 'CANCEL', reasonText: 'erro' }),
    ).toThrow(/15/);
  });
});
