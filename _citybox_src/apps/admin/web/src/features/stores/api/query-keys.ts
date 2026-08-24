export const storesKeys = {
  all: ['stores'] as const,
  lists: () => [...storesKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...storesKeys.lists(), params] as const,
  details: () => [...storesKeys.all, 'detail'] as const,
  detail: (id: string) => [...storesKeys.details(), id] as const,
  auditLogs: (id: string) => [...storesKeys.all, 'audit-log', id] as const,
  auditLog: (id: string, params: Record<string, unknown>) =>
    [...storesKeys.auditLogs(id), params] as const,
  memberRoles: (id: string) => [...storesKeys.all, 'member-roles', id] as const,
  /**
   * Responsável lido na vertical. Chave separada de `detail` porque a origem do dado é
   * outra (a `vertical-api`, não o schema `platform`) e ela não deve ser invalidada junto
   * com mutações de loja que não tocam o responsável.
   */
  verticalOwner: (id: string) => [...storesKeys.all, 'vertical-owner', id] as const,
  /**
   * Solicitações de pacote de assinatura (proxy → clinica-api). Chave separada de `detail`
   * porque a origem é a vertical e mutações de loja não a alteram.
   */
  signaturePackageRequests: (id: string) =>
    [...storesKeys.all, 'signature-package-requests', id] as const,
};
