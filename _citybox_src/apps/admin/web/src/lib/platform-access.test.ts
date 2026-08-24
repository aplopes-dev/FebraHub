import { describe, it, expect } from 'vitest';
import { hasPlatformAdminAccess } from './platform-access';

describe('hasPlatformAdminAccess', () => {
  it('aceita platform_admin', () => {
    expect(hasPlatformAdminAccess(['platform_admin'])).toBe(true);
  });

  it('aceita platform_operator', () => {
    expect(hasPlatformAdminAccess(['platform_operator'])).toBe(true);
  });

  // `store_staff` e `platform_admin_client` eram roles do realm compartilhado
  // `citybox-dev` / client `citybox-backoffice` — não existem em `citybox-admin`.
  it('rejeita roles que não existem no realm citybox-admin', () => {
    expect(hasPlatformAdminAccess(['store_staff'])).toBe(false);
    expect(hasPlatformAdminAccess(['platform_admin_client'])).toBe(false);
  });
});
