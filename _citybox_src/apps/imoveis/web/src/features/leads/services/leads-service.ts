/**
 * Porta de entrada de dados da feature leads — consome imoveis-api.
 */
import { OTHER_AGENT_ID } from '@/features/shared/constants/agents';
import { ImoveisApiError, imoveisFetch, imoveisUpload } from '@/lib/imoveis-api';
import type {
  ContactLeadDetail,
  LeadStatus,
  ListLeadsParams,
  ListLeadsResult,
} from '../types';

export type LeadWriteInput = {
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  leadSource: ContactLeadDetail['leadSource'];
  interestedPropertyType: ContactLeadDetail['interestedPropertyType'];
  budgetRange: string;
  preferredLocation: string;
  purpose: ContactLeadDetail['purpose'];
  paymentIntents?: ContactLeadDetail['paymentIntents'];
  latestFollowUp: string;
  nextFollowUp: string;
  notes: string;
  photoUrl?: string;
  propertyName?: string;
  hasSuggestion?: boolean;
  agentIds?: ContactLeadDetail['agentIds'];
  matchedProperties?: ContactLeadDetail['matchedProperties'];
  documents?: ContactLeadDetail['documents'];
  activities?: ContactLeadDetail['activities'];
  agentId?: string;
};

function sanitizeLeadWriteInput(input: LeadWriteInput): LeadWriteInput {
  return {
    ...input,
    matchedProperties: input.matchedProperties?.map(({ id, name }) => ({
      id,
      name,
    })),
    documents: input.documents?.map(({ id, name, sizeLabel, kind, addedAt }) => ({
      id,
      name,
      sizeLabel,
      kind: kind === 'contract' ? 'contract' : 'other',
      addedAt,
    })),
  };
}

function csv(values?: readonly string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

function buildListQuery(params: ListLeadsParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.search?.trim()) q.set('search', params.search.trim());
  const status = csv(params.status);
  if (status) q.set('status', status);
  const leadSource = csv(params.leadSource);
  if (leadSource) q.set('leadSource', leadSource);
  const purpose = csv(params.purpose);
  if (purpose) q.set('purpose', purpose);
  const propertyType = csv(params.interestedPropertyType);
  if (propertyType) q.set('interestedPropertyType', propertyType);
  if (params.agentId) q.set('agentId', params.agentId);
  if (params.followUpUntil) q.set('followUpUntil', params.followUpUntil);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export async function listLeads(
  params: ListLeadsParams = {},
): Promise<ListLeadsResult> {
  return imoveisFetch<ListLeadsResult>(`/v1/leads${buildListQuery(params)}`);
}

export async function getLeadById(
  id: string,
): Promise<ContactLeadDetail | null> {
  try {
    const res = await imoveisFetch<{ data: ContactLeadDetail }>(
      `/v1/leads/${id}`,
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createLead(
  input: LeadWriteInput,
): Promise<ContactLeadDetail> {
  const res = await imoveisFetch<{ data: ContactLeadDetail }>('/v1/leads', {
    method: 'POST',
    body: JSON.stringify(sanitizeLeadWriteInput(input)),
  });
  return res.data;
}

export async function updateLead(
  id: string,
  input: LeadWriteInput,
): Promise<ContactLeadDetail | null> {
  try {
    const res = await imoveisFetch<{ data: ContactLeadDetail }>(
      `/v1/leads/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(sanitizeLeadWriteInput(input)),
      },
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<ContactLeadDetail | null> {
  try {
    const res = await imoveisFetch<{ data: ContactLeadDetail }>(
      `/v1/leads/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    await imoveisFetch<void>(`/v1/leads/${id}`, { method: 'DELETE' });
    return true;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return false;
    throw err;
  }
}

export async function syncAgentCatalogLeads(
  agentId: string,
  selectedIds: readonly string[],
): Promise<void> {
  await imoveisFetch<void>(`/v1/agents/${agentId}/leads`, {
    method: 'PUT',
    body: JSON.stringify({
      leadIds: [...selectedIds],
      fallbackAgentId: OTHER_AGENT_ID,
    }),
  });
}

export type BatchCreateLeadItem = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type BatchCreateLeadsResult = {
  successCount: number;
  skippedCount: number;
};

/** Importação CSV em lote — `POST /v1/leads/batch`. */
export async function batchCreateLeads(
  leads: readonly BatchCreateLeadItem[],
): Promise<BatchCreateLeadsResult> {
  return imoveisFetch<BatchCreateLeadsResult>('/v1/leads/batch', {
    method: 'POST',
    body: JSON.stringify({ leads: [...leads] }),
  });
}

export async function uploadLeadDocument(
  leadId: string,
  file: File,
  kind: 'contract' | 'other' = 'other',
): Promise<ContactLeadDetail> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  formData.append('kind', kind);
  const res = await imoveisUpload<{ data: ContactLeadDetail }>(
    `/v1/leads/${leadId}/documents`,
    formData,
  );
  return res.data;
}

export type SendLeadDocumentWhatsAppResult = {
  shareUrl: string;
  whatsappUrl: string;
  sentAt: string;
  lead: ContactLeadDetail;
};

export async function sendLeadDocumentWhatsApp(
  leadId: string,
  documentId: string,
): Promise<SendLeadDocumentWhatsAppResult> {
  const res = await imoveisFetch<{ data: SendLeadDocumentWhatsAppResult }>(
    `/v1/leads/${leadId}/documents/${documentId}/send-whatsapp`,
    { method: 'POST' },
  );
  return res.data;
}
