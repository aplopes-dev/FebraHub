import { create } from 'xmlbuilder2';
import type { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';

export type XmlDocumentInput = Record<string, unknown>;

/// Wrapper fino sobre xmlbuilder2 — builders específicos de NF-e/NFS-e (fases
/// futuras, US1/US2) montam o objeto JS com a estrutura exigida pelo layout
/// oficial e chamam esta função para produzir o XML final em UTF-8.
export function buildXml(
  input: XmlDocumentInput,
  options?: { prettyPrint?: boolean; docOptions?: XMLBuilderCreateOptions },
): Buffer {
  const doc = create(
    { version: '1.0', encoding: 'UTF-8', ...options?.docOptions },
    input,
  );
  const xml = doc.end({ prettyPrint: options?.prettyPrint ?? false });
  return Buffer.from(xml, 'utf-8');
}
