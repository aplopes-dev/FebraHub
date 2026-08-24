import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  WhatsappSession,
  WhatsappTemplateItem,
  WhatsappTemplateKey,
} from '../types/whatsapp';

type SessionEnvelope = { data: WhatsappSession };
type TemplatesEnvelope = { data: WhatsappTemplateItem[] };
type OkEnvelope = { data: { ok: true } };
type RequestQrEnvelope = { data: { status: string } };

export async function getWhatsappSession(storeId: string): Promise<WhatsappSession> {
  const res = await clinicaFetch<SessionEnvelope>(storeId, '/v1/whatsapp/session');
  return res.data;
}

export async function requestWhatsappQr(
  storeId: string,
): Promise<{ status: string }> {
  const res = await clinicaFetch<RequestQrEnvelope>(
    storeId,
    '/v1/whatsapp/session/qr',
    { method: 'POST' },
  );
  return res.data;
}

export async function disconnectWhatsappSession(storeId: string): Promise<void> {
  await clinicaFetch<OkEnvelope>(storeId, '/v1/whatsapp/session', {
    method: 'DELETE',
  });
}

export async function listWhatsappTemplates(
  storeId: string,
): Promise<WhatsappTemplateItem[]> {
  const res = await clinicaFetch<TemplatesEnvelope>(
    storeId,
    '/v1/whatsapp/templates',
  );
  return res.data;
}

export async function updateWhatsappTemplates(
  storeId: string,
  items: Array<{ key: WhatsappTemplateKey; body: string }>,
): Promise<WhatsappTemplateItem[]> {
  const res = await clinicaFetch<TemplatesEnvelope>(
    storeId,
    '/v1/whatsapp/templates',
    {
      method: 'PUT',
      body: JSON.stringify({ items }),
    },
  );
  return res.data;
}
