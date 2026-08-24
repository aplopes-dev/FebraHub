import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { resolvePermissions } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('v1/auth')
export class GetPermissionsRoute {
  @Get('permissions')
  @ApiOperation({
    summary: 'Roles e permissões do usuário autenticado (backoffice/ERP)',
  })
  handle(@Req() req: Request & { user?: AuthenticatedUser }) {
    const user = req.user;
    if (!user) return { roles: [], permissions: [] };
    return { roles: user.roles, permissions: resolvePermissions(user) };
  }
}
