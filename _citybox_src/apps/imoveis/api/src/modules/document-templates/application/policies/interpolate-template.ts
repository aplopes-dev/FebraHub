import Handlebars from 'handlebars';
import type { DocumentMergeSnapshot } from './document-variable-catalog';

const handlebars = Handlebars.create();
handlebars.registerHelper('eq', (left: unknown, right: unknown) => left === right);

/** Interpola `{{lead.nome}}` etc. Valores do snapshot são escapados; o HTML do modelo permanece. */
export function interpolateTemplate(
  html: string,
  snapshot: DocumentMergeSnapshot,
): string {
  const template = handlebars.compile(html, { strict: false, noEscape: false });
  return template(snapshot);
}
