import { ForbiddenException } from '@nestjs/common';
import { canViewSalesFunnel } from '@citybox/clinica-permissions';

import type { PermissionUser } from '../../../../shared/infra/http/decorators/permissions';

export function assertCanViewSalesFunnel(
  funnel: { name: string; isDefault: boolean },
  user: PermissionUser,
): void {
  if (!canViewSalesFunnel(funnel, user.permissions ?? [])) {
    throw new ForbiddenException('Sem permissão para visualizar este funil');
  }
}
