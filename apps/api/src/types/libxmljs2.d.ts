// `libxmljs2` não publica tipos próprios nem tem pacote `@types/libxmljs2` no
// registro npm — declaração mínima cobrindo só a superfície usada pelo núcleo de
// NFC-e (soap-client.ts, soap-envelope.ts, xsd-validator.ts). Portado de
// @citybox/fiscal-api.
declare module 'libxmljs2' {
  export interface ValidationError {
    message?: string;
    line?: number;
    column?: number;
  }

  // Cobre só a superfície usada para extrair o XML bruto embutido dentro de um
  // wrapper genérico (`nfeResultMsg`) de uma resposta SOAP da SEFAZ.
  export interface Element {
    name(): string;
    text(): string;
    toString(): string;
    childNodes(): Element[];
  }

  export interface Document {
    validate(xsdDoc: Document): boolean;
    validationErrors: ValidationError[];
    root(): Element | null;
    // XPath — usar `local-name()` evita precisar registrar namespaces.
    find(xpath: string): Element[];
    get(xpath: string): Element | null;
  }

  export interface ParseXmlOptions {
    // Necessário para resolver `xs:include`/`xs:import` com `schemaLocation`
    // relativo (ex.: schemas multi-arquivo como o da NF-e 4.00) — sem isso o
    // libxml2 falha ao montar o schema com "Invalid XSD schema".
    baseUrl?: string;
  }

  export function parseXml(source: string, options?: ParseXmlOptions): Document;
}
