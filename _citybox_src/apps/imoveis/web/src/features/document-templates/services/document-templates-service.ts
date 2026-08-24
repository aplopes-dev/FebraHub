import { imoveisFetch } from '@/lib/imoveis-api';
import type {
  DocumentTemplate,
  DocumentTemplateWrite,
  DocumentVariablesCatalog,
  GenerateDocumentContext,
  GeneratedDocumentResult,
} from '../types';

type Envelope<T> = { data: T };
type ListEnvelope<T> = {
  data: T[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

export async function listDocumentTemplates(params: {
  page?: number;
  perPage?: number;
  search?: string;
  tipo?: string;
}): Promise<ListEnvelope<DocumentTemplate>> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.tipo) q.set('tipo', params.tipo);
  const qs = q.toString();
  return imoveisFetch<ListEnvelope<DocumentTemplate>>(
    `/v1/document-templates${qs ? `?${qs}` : ''}`,
  );
}

export async function listDocumentVariables(): Promise<DocumentVariablesCatalog> {
  const res = await imoveisFetch<Envelope<DocumentVariablesCatalog>>(
    '/v1/document-templates/variables',
  );
  return res.data;
}

export async function createDocumentTemplate(
  input: DocumentTemplateWrite,
): Promise<DocumentTemplate> {
  const res = await imoveisFetch<Envelope<DocumentTemplate>>(
    '/v1/document-templates',
    { method: 'POST', body: JSON.stringify(input) },
  );
  return res.data;
}

export async function updateDocumentTemplate(
  id: string,
  input: Partial<DocumentTemplateWrite>,
): Promise<DocumentTemplate> {
  const res = await imoveisFetch<Envelope<DocumentTemplate>>(
    `/v1/document-templates/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  return res.data;
}

export async function deleteDocumentTemplate(id: string): Promise<void> {
  await imoveisFetch(`/v1/document-templates/${id}`, { method: 'DELETE' });
}

export async function seedDefaultDocumentTemplates(): Promise<DocumentTemplate[]> {
  const res = await imoveisFetch<Envelope<DocumentTemplate[]>>(
    '/v1/document-templates/defaults',
    { method: 'POST' },
  );
  return res.data;
}

export async function previewDocument(input: {
  templateId: string;
} & GenerateDocumentContext): Promise<{ html: string; titulo: string; tipo: string }> {
  const res = await imoveisFetch<
    Envelope<{ html: string; titulo: string; tipo: string }>
  >('/v1/documents/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function generateDocument(input: {
  templateId: string;
  kind?: 'contract' | 'other';
} & GenerateDocumentContext): Promise<GeneratedDocumentResult> {
  const res = await imoveisFetch<Envelope<GeneratedDocumentResult>>(
    '/v1/documents/generate',
    { method: 'POST', body: JSON.stringify(input) },
  );
  return res.data;
}
