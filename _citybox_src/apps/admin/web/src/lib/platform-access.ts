/**
 * Gate de acesso ao admin-web.
 *
 * As roles do realm `citybox-admin` são `platform_admin` e `platform_operator`
 * (ADR C-16). `platform_admin_client` saiu: era a variante de client role do
 * `citybox-backoffice`, que não existe mais. `platform.admin` continua aceito
 * porque é a permissão resolvida por `resolvePermissions` no admin-api, e esta
 * função recebe tanto roles quanto permissões.
 */
export function hasPlatformAdminAccess(rolesOrPerms: string[]): boolean {
  return (
    rolesOrPerms.includes('platform_admin') ||
    rolesOrPerms.includes('platform_operator') ||
    rolesOrPerms.includes('platform.admin')
  );
}
