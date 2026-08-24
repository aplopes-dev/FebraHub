import type { VerticalManifest } from '@/lib/vertical/types';
import { fetchMyStorePermissions } from '@/lib/stores-api';
import { createClinicNavPermissions } from './lib/clinic-nav-permissions';
import { CLINIC_BRAND, CLINIC_NAV_MODULES } from './lib/navigation';
import { CLINIC_THEME } from './lib/theme';

export const clinicManifest: VerticalManifest = {
  id: 'clinic',
  label: 'Clínica',
  platformPermission: 'vertical_access',
  brand: CLINIC_BRAND,
  theme: CLINIC_THEME,
  navModules: CLINIC_NAV_MODULES,
  navDefaults: { defaultModuleId: 'clinica', defaultLeafId: 'visao-geral' },
  permissions: createClinicNavPermissions(),
  usesStoreBrandingApi: false,
  /** Sidebar/rotas usam IDs CASL de `GET /v1/members/me`, não só Keycloak. */
  usesStorePermissionsApi: true,
  rolesAdminPathPrefix: '/configuracoes/equipe',
  services: {
    fetchStoreSettings: async () => ({
      theme: 'light',
      brandAccent: '',
      displayName: null,
      hasLogo: false,
    }),
    fetchStoreLogoBlob: async () => null,
    fetchMyStorePermissions,
  },
};
