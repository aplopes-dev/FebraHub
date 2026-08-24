import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
import type { ClinicSettingsFormData } from '../types/clinic-settings';

const CLINICA_PROXY_PREFIX = '/api/proxy/clinica';

type ClinicProfileApiResponse = Omit<ClinicSettingsFormData, 'logoUrl'> & {
  logoUrl: string | null;
};

type ClinicProfileEnvelope = { data: ClinicProfileApiResponse };

export type ClinicProfilePayload = Omit<ClinicSettingsFormData, 'logoUrl'>;

export function clinicLogoProxyUrl(storeId: string): string {
  const params = new URLSearchParams({ storeId });
  return `${CLINICA_PROXY_PREFIX}/v1/clinic-profile/logo?${params.toString()}`;
}

function toClinicSettingsFormData(
  response: ClinicProfileApiResponse,
  storeId: string,
): ClinicSettingsFormData {
  return {
    clinicName: response.clinicName,
    cnpj: response.cnpj,
    communicationsName: response.communicationsName,
    responsible: response.responsible,
    logoUrl: response.logoUrl ? clinicLogoProxyUrl(storeId) : undefined,
    openingTime: response.openingTime,
    closingTime: response.closingTime,
    email: response.email,
    phone: response.phone,
    mobile: response.mobile,
    cep: response.cep,
    street: response.street,
    number: response.number,
    complement: response.complement,
    neighborhood: response.neighborhood,
    city: response.city,
    state: response.state,
  };
}

function toApiPayload(payload: ClinicProfilePayload) {
  return {
    clinicName: payload.clinicName,
    cnpj: payload.cnpj,
    communicationsName: payload.communicationsName,
    responsible: payload.responsible,
    openingTime: payload.openingTime,
    closingTime: payload.closingTime,
    email: payload.email,
    phone: payload.phone,
    mobile: payload.mobile,
    cep: payload.cep,
    street: payload.street,
    number: payload.number,
    complement: payload.complement,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
  };
}

export async function getClinicProfile(storeId: string): Promise<ClinicSettingsFormData> {
  const res = await clinicaFetch<ClinicProfileEnvelope>(storeId, '/v1/clinic-profile');
  return toClinicSettingsFormData(res.data, storeId);
}

export async function upsertClinicProfile(
  storeId: string,
  payload: ClinicProfilePayload,
): Promise<ClinicSettingsFormData> {
  const res = await clinicaFetch<ClinicProfileEnvelope>(storeId, '/v1/clinic-profile', {
    method: 'PUT',
    body: JSON.stringify(toApiPayload(payload)),
  });
  return toClinicSettingsFormData(res.data, storeId);
}

export async function uploadClinicLogo(
  storeId: string,
  file: File,
): Promise<ClinicSettingsFormData> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await clinicaUpload<ClinicProfileEnvelope>(
    storeId,
    '/v1/clinic-profile/logo',
    formData,
  );
  return toClinicSettingsFormData(res.data, storeId);
}

export async function deleteClinicLogo(storeId: string): Promise<ClinicSettingsFormData> {
  const res = await clinicaFetch<ClinicProfileEnvelope>(storeId, '/v1/clinic-profile/logo', {
    method: 'DELETE',
  });
  return toClinicSettingsFormData(res.data, storeId);
}
