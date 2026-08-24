import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  NFSE_LEIAUTE_VERSION,
  NFSE_XSD_DIRECTORY,
} from '../nfse-leiaute-version';
import { buildDpsXml } from '../dps-xml.builder';
import { buildEventoXml } from '../evento-xml.builder';

/// T042 — trava contra divergência entre a versão que o código declara e a que
/// os XSD versionados suportam.
///
/// Existe porque leiaute vencido **derruba emissão em produção sem nenhuma
/// mudança de código**: o órgão passa a exigir outra versão e nada no
/// repositório muda. Um teste é o único aviso que não depende de alguém lembrar.
describe('versão do leiaute NFS-e', () => {
  const xsdDirectory = join(process.cwd(), NFSE_XSD_DIRECTORY);

  it('has the XSD directory that matches the declared version', () => {
    expect(existsSync(xsdDirectory)).toBe(true);
  });

  /// `TVerNFSe` enumera as versões que os schemas aceitam. Se a versão que
  /// declaramos sair dessa lista, todo XML que montarmos é recusado por schema.
  it('declares a version the versioned XSDs actually accept', () => {
    const tiposSimples = readFileSync(
      join(xsdDirectory, `tiposSimples_v${NFSE_LEIAUTE_VERSION}.xsd`),
      'utf-8',
    );

    const match = tiposSimples.match(
      /name="TVerNFSe"[\s\S]*?<xs:pattern value="([^"]+)"/,
    );
    expect(match).not.toBeNull();

    const accepted = new RegExp(`^(?:${match?.[1] ?? ''})$`);
    expect(accepted.test(NFSE_LEIAUTE_VERSION)).toBe(true);
  });

  /// DPS e evento são montados por builders distintos. Antes, cada um escrevia
  /// a versão por conta própria — nada impedia que divergissem, e a divergência
  /// só apareceria como rejeição do órgão fiscal.
  it('emits the same version from every builder', () => {
    const { xml: dps } = buildDpsXml({
      environment: 'HOMOLOGATION',
      provider: {
        cnpj: '36698609000123',
        municipalRegistration: '987654',
        legalName: 'EMPRESA TESTE',
        cityCodeIbge: '2913606',
        simplesNacionalOption: '3',
      },
      customer: {
        documentType: 'CPF',
        document: '11144477735',
        name: 'CLIENTE',
      },
      service: {
        description: 'Servico de teste',
        municipalServiceCode: '01.01',
        nationalServiceCode: '010101',
        issRate: 5,
        issWithheld: false,
        totalValue: 100,
      },
      series: '1',
      number: '1',
    });

    const { xml: evento } = buildEventoXml({
      environment: 'HOMOLOGATION',
      kind: 'CANCEL',
      authorAtDocument: { documentType: 'CNPJ', document: '36698609000123' },
      nfseAccessKey: '29136062366986090001230000100000000000000000000005',
      reasonCode: '1',
      reasonText: 'Erro no preenchimento do pedido original',
    });

    const expected = `versao="${NFSE_LEIAUTE_VERSION}"`;
    expect(dps.toString('utf-8')).toContain(expected);
    expect(evento.toString('utf-8')).toContain(expected);
  });
});
