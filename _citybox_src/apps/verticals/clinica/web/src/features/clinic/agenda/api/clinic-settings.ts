'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicSettingsKeys } from '@/features/clinic/modules/settings/hooks/query-keys';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import type { ClinicSettingsFormData } from '@/features/clinic/modules/settings/types/clinic-settings';
import { useStore } from '@/lib/store-context';

export interface ClinicData {
  id: string;
  name: string;
  openingTime: string;
  closingTime: string;
}

export function profileToAgendaClinicData(
  storeId: string,
  profile: ClinicSettingsFormData,
): ClinicData {
  return {
    id: storeId,
    name: profile.clinicName,
    openingTime: profile.openingTime,
    closingTime: profile.closingTime,
  };
}

export async function getAgendaClinicSettings(storeId: string): Promise<ClinicData> {
  const profile = await getClinicProfile(storeId);
  return profileToAgendaClinicData(storeId, profile);
}

export function useClinicSettings() {
  const { storeId } = useStore();

  return useQuery({
    queryKey: clinicSettingsKeys.profile(storeId ?? ''),
    queryFn: () => getClinicProfile(storeId!),
    enabled: Boolean(storeId),
    select: (profile) => profileToAgendaClinicData(storeId!, profile),
  });
}
