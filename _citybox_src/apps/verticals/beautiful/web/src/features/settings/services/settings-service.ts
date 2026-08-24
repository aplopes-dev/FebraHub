import {
  beautifulFetch,
  getActiveStoreId,
  getBeautifulApiBase,
} from '@/lib/beautiful-api';
import type { WeekSchedule } from '@/lib/work-schedule';

export type StoreSettings = {
  id: string;
  name: string;
  themeId: string;
  cnpj: string | null;
  communicationsName: string | null;
  responsible: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettingsFormData = {
  name: string;
  cnpj: string;
  communicationsName: string;
  responsible: string;
  email: string;
  phone: string;
  mobile: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type StoreWorkSchedule = {
  week: WeekSchedule;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return beautifulFetch<StoreSettings>('/v1/settings/store');
}

export async function updateStoreTheme(themeId: string): Promise<StoreSettings> {
  return beautifulFetch<StoreSettings>('/v1/settings/store', {
    method: 'PATCH',
    body: JSON.stringify({ themeId }),
  });
}

export async function updateStoreSettings(
  data: StoreSettingsFormData,
): Promise<StoreSettings> {
  return beautifulFetch<StoreSettings>('/v1/settings/store', {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name.trim(),
      cnpj: emptyToNull(data.cnpj),
      communicationsName: emptyToNull(data.communicationsName),
      responsible: emptyToNull(data.responsible),
      email: emptyToNull(data.email),
      phone: emptyToNull(data.phone),
      mobile: emptyToNull(data.mobile),
      cep: emptyToNull(data.cep),
      street: emptyToNull(data.street),
      number: emptyToNull(data.number),
      complement: emptyToNull(data.complement),
      neighborhood: emptyToNull(data.neighborhood),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state)?.toUpperCase() ?? null,
    }),
  });
}

export async function getStoreWorkSchedule(): Promise<StoreWorkSchedule> {
  return beautifulFetch<StoreWorkSchedule>('/v1/settings/store/work-schedule');
}

export async function replaceStoreWorkSchedule(
  week: WeekSchedule,
): Promise<StoreWorkSchedule> {
  return beautifulFetch<StoreWorkSchedule>('/v1/settings/store/work-schedule', {
    method: 'PUT',
    body: JSON.stringify({ week }),
  });
}

export function resolveStoreLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  const base = getBeautifulApiBase();
  const path = logoUrl.replace(/^\//, '');
  const sep = path.includes('?') ? '&' : '?';
  return `${base}/${path}${sep}storeId=${encodeURIComponent(getActiveStoreId())}`;
}

export async function uploadStoreLogo(file: File): Promise<StoreSettings> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await beautifulFetch<{ data: StoreSettings }>(
    '/v1/settings/store/logo',
    {
      method: 'POST',
      body: formData,
    },
  );
  return response.data;
}

export async function deleteStoreLogo(): Promise<StoreSettings> {
  const response = await beautifulFetch<{ data: StoreSettings }>(
    '/v1/settings/store/logo',
    { method: 'DELETE' },
  );
  return response.data;
}
