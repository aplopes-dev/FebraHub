import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import * as libxmljs from 'libxmljs2';

/**
 * Validação de XML contra o XSD oficial da NF-e/NFC-e 4.00. Portado de
 * @citybox/fiscal-api (xsd-validator.ts + nfe-xsd-path.ts). Usa `libxmljs2` com
 * `baseUrl` — obrigatório para resolver `xs:include`/`xs:import`.
 */

/**
 * Caminho do XSD raiz da NF-e 4.00. `nfe_v4.00.xsd` inclui `leiauteNFe_v4.00.xsd`,
 * que importa/inclui os demais arquivos no mesmo diretório. Resolvido via
 * `process.cwd()` (estável entre ts-jest e o build compilado). Sobrescrevível via
 * `NFE_XSD_PATH` para deployments com layout diferente.
 */
export const NFE_XSD_PATH =
  process.env.NFE_XSD_PATH ??
  join(process.cwd(), 'resources/xsd/nfe/nfe_v4.00.xsd');

export type XsdValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/**
 * Cache dos schemas já parseados — schemas oficiais (a NF-e 4.00 tem 5 arquivos,
 * 10k+ linhas ao todo via xs:include/xs:import) não mudam em runtime.
 */
const xsdDocumentCache = new Map<string, libxmljs.Document>();

function loadXsdDocument(xsdPath: string): libxmljs.Document {
  const cached = xsdDocumentCache.get(xsdPath);
  if (cached) return cached;

  // `baseUrl` é obrigatório para schemas multi-arquivo: sem ele, libxml2 não
  // consegue resolver `xs:include`/`xs:import` com `schemaLocation` relativo e
  // falha com "Invalid XSD schema" ao tentar validar.
  const doc = libxmljs.parseXml(readFileSync(xsdPath, 'utf-8'), {
    baseUrl: xsdPath,
  });
  xsdDocumentCache.set(xsdPath, doc);
  return doc;
}

/**
 * Valida um XML contra o schema XSD oficial. Cada documento/layout referencia
 * seu(s) próprio(s) .xsd — caminho fornecido pelo chamador, não fixado aqui.
 */
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

/**
 * Lança `BadRequestException` (→ 400) se o XML não validar — uso direto nos
 * fluxos de emissão, antes de qualquer tentativa de transmissão.
 */
export function assertValidXml(
  xml: Buffer | string,
  xsdPath: string,
  context = 'assertValidXml',
): void {
  const result = validateXmlAgainstXsd(xml, xsdPath);
  if (!result.valid) {
    throw new BadRequestException(
      `XML inválido contra o XSD (${context}): ${result.errors.join('; ')}`,
    );
  }
}
