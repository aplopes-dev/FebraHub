export const clinicSettingsKeys = {
  all: (storeId: string) => ['clinic', 'settings', storeId] as const,
  profile: (storeId: string) => [...clinicSettingsKeys.all(storeId), 'profile'] as const,
  plans: (storeId: string) => [...clinicSettingsKeys.all(storeId), 'plans'] as const,
  plan: (storeId: string, planId: string) =>
    [...clinicSettingsKeys.plans(storeId), planId] as const,
};
