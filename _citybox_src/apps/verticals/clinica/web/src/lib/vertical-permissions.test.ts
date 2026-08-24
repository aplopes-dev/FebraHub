import { describe, expect, it } from 'vitest';
import {
  hasBackofficeAccess,
  hasVerticalViewPermission,
  resolveBackofficePermissions,
} from './vertical-permissions';

describe('vertical-permissions', () => {
  it('concede acesso com o permission ID CASL', () => {
    expect(hasBackofficeAccess(['vertical_access'])).toBe(true);
    expect(hasVerticalViewPermission(['vertical_access'])).toBe(true);
  });

  // ADR C-16: o token vem do realm `citybox-clinica`, emitido para o client
  // `clinica-web` e validado por issuer + azp na API. Estar no realm é o gate — um
  // usuário sem realm role continua sendo um usuário da clínica.
  it('concede acesso a sessão do realm próprio mesmo sem roles no token', () => {
    expect(hasBackofficeAccess([])).toBe(true);
  });

  it('mantém as roles do token ao expandir e acrescenta vertical_access', () => {
    const perms = resolveBackofficePermissions(['platform.admin']);
    expect(perms).toContain('platform.admin');
    expect(perms).toContain('vertical_access');
  });

  it('não duplica vertical_access quando já veio no token', () => {
    const perms = resolveBackofficePermissions(['vertical_access']);
    expect(perms.filter((p) => p === 'vertical_access')).toHaveLength(1);
  });

  // Regressão: as roles do realm compartilhado saíram de cena. Nenhuma delas pode
  // continuar sendo traduzida para `platform.admin` — o mapa foi removido.
  it('não traduz mais as realm roles legadas em platform.admin', () => {
    for (const legacy of [
      'platform_admin',
      'platform_admin_client',
      'store_staff',
      'vertical.clinic.view',
    ]) {
      expect(resolveBackofficePermissions([legacy])).not.toContain('platform.admin');
    }
  });

  it('hasVerticalViewPermission só aceita a permissão da própria vertical', () => {
    expect(hasVerticalViewPermission(['vertical.comercio.view'])).toBe(false);
  });
});
