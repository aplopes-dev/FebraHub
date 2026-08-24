import { Controller, Get, Inject, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from './auth.types.js';
import { resolvePermissions } from './permissions.js';
import { UsersService } from '../users/users.service.js';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  async me(@Req() req: Request & { user?: AuthUser }) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    return this.usersService.getMeProfile(user);
  }

  @Get('permissions')
  @ApiBearerAuth()
  permissions(@Req() req: Request & { user?: AuthUser }) {
    const user = req.user;
    if (!user) return { roles: [], permissions: [] };
    return { roles: user.roles, permissions: resolvePermissions(user) };
  }

  @Post('logout')
  @ApiBearerAuth()
  logout() {
    return { ok: true, message: 'Revogue o refresh token no Keycloak (end-session)' };
  }
}