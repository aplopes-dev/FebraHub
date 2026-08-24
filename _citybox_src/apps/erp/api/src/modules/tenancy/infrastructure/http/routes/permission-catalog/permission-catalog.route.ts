import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { getPermissionCatalog } from '../../../../../../shared/infra/http/permissions/permission-catalog';

/**
 * Catálogo canônico de permissões finas — alimenta a UI de edição de perfis.
 * Exige tenant + `org.view` (qualquer membro autenticado na organização).
 */
@ApiTags('permission-catalog')
@Controller('v1/permission-catalog')
export class PermissionCatalogRoute {
  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Catálogo de permissões finas do ERP',
    description:
      'Grupos/subgrupos/itens do catálogo canônico. Fonte de verdade para montar perfis de acesso.',
  })
  handle() {
    const catalog = getPermissionCatalog();
    return { data: catalog };
  }
}
