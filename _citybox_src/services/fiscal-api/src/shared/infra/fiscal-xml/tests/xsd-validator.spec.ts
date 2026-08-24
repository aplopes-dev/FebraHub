import { assertValidXml, validateXmlAgainstXsd } from '../xsd-validator';
import { XmlValidationError } from '../errors/xml-validation.error';
import { NFE_XSD_PATH } from '../../../../modules/nfe/infrastructure/xml/nfe-xsd-path';

// Schema oficial da NF-e 4.00 (nfe_v4.00.xsd → leiauteNFe_v4.00.xsd →
// xmldsig-core-schema_v1.01.xsd + tiposBasico_v4.00.xsd + DFeTiposBasicos_v1.00.xsd),
// fornecido pelo usuário em specs/002-fiscal-api/contracts/NFe/ e copiado para
// resources/xsd/nfe/ como dependência de runtime do serviço.

describe('validateXmlAgainstXsd (schema real da NF-e 4.00)', () => {
  it('resolves the multi-file schema via xs:include/xs:import (baseUrl) and rejects an incomplete NFe', () => {
    // Regressão: sem `baseUrl` no parseXml do XSD, libxml2 falha ao montar o
    // schema inteiro ("Invalid XSD schema") porque não resolve os
    // xs:include/xs:import com schemaLocation relativo — descoberto ao
    // integrar o schema oficial de verdade (não é um schema de teste fabricado).
    const incompleteNfe =
      '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"></NFe>';

    const result = validateXmlAgainstXsd(incompleteNfe, NFE_XSD_PATH);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join(' ')).toContain('infNFe');
    }
  });

  it('throws XmlValidationError via assertValidXml for invalid XML', () => {
    const incompleteNfe =
      '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"></NFe>';

    expect(() => assertValidXml(incompleteNfe, NFE_XSD_PATH, 'test')).toThrow(
      XmlValidationError,
    );
  });

  it('rejects XML with the wrong root element entirely', () => {
    const wrongRoot = '<NotAnNFe></NotAnNFe>';

    const result = validateXmlAgainstXsd(wrongRoot, NFE_XSD_PATH);

    expect(result.valid).toBe(false);
  });
});
