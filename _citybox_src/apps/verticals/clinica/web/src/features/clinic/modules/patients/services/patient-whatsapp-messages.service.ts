import { clinicaFetch } from '@/features/clinic/shared/api';

export type PatientWhatsappMessage = {
  id: string;
  direction: 'outbound' | 'inbound';
  body: string;
  status: string;
  appointmentId: string | null;
  createdAt: string;
};

type MessagesEnvelope = {
  data: PatientWhatsappMessage[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export async function listPatientWhatsappMessages(
  storeId: string,
  patientId: string,
  params: { page?: number; perPage?: number } = {},
): Promise<{
  items: PatientWhatsappMessage[];
  meta: MessagesEnvelope['meta'];
}> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.perPage) search.set('perPage', String(params.perPage));
  const qs = search.toString();
  const res = await clinicaFetch<MessagesEnvelope>(
    storeId,
    `/v1/patients/${patientId}/whatsapp-messages${qs ? `?${qs}` : ''}`,
  );
  return { items: res.data, meta: res.meta };
}
