import { readFileSync } from 'fs';
import * as libxmljs from 'libxmljs2';
import { XmlValidationError } from './errors/xml-validation.error';

export type XsdValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/// Cache dos schemas já parseados — schemas oficiais (ex.: NF-e 4.00 tem 5
/// arquivos, 10k+ linhas ao todo via xs:include/xs:import) não mudam em
/// runtime; reparsear a cada chamada seria desperdício.
const xsdDocumentCache = new Map<string, libxmljs.Document>();

function loadXsdDocument(xsdPath: string): libxmljs.Document {
  const cached = xsdDocumentCache.get(xsdPath);
  if (cached) return cached;

  // `baseUrl` é obrigatório para schemas multi-arquivo: sem ele, libxml2 não
  // consegue resolver `xs:include`/`xs:import` com `schemaLocation` relativo
  // (ex.: leiauteNFe_v4.00.xsd inclui tiposBasico_v4.00.xsd, que fica no mesmo
  // diretório) e falha com "Invalid XSD schema" ao tentar validar.
  const doc = libxmljs.parseXml(readFileSync(xsdPath, 'utf-8'), {
    baseUrl: xsdPath,
  });
  xsdDocumentCache.set(xsdPath, doc);
  return doc;
}

/// Valida um XML contra o schema XSD oficial (FR-009). Cada provider (SEFAZ-BA,
/// Ilhéus) referencia seu(s) próprio(s) .xsd — caminho fornecido pelo chamador,
/// não fixado aqui, porque o schema muda por documento/layout/versão.
export function validateXmlAgainstXsd(
  xml: Buffer | string,
  xsdPath: string,
): XsdValidationResult {
  const xsdDoc = loadXsdDocument(xsdPath);
  const xmlDoc = libxmljs.parseXml(xml.toString());
  const isValid = xmlDoc.validate(xsdDoc);
  if (isValid) return { valid: true };

  const errors = xmlDoc.validationErrors.map(
    (error) => error.message?.trim() ?? 'Erro de validação desconhecido',
  );
  return { valid: false, errors };
}

/// Lança XmlValidationError (→ 422) se o XML não validar — uso direto nos
/// use-cases de emissão, antes de qualquer tentativa de transmissão (FR-009).
export function assertValidXml(
  xml: Buffer | string,
  xsdPath: string,
  context: string,
): void {
  const result = validateXmlAgainstXsd(xml, xsdPath);
  if (!result.valid) {
    throw new XmlValidationError(context, result.errors);
  }
}
