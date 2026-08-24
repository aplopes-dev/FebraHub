import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { InjectService } from '../common/inject.js';
import { unauthorized } from '../common/envelope.js';
import { KeycloakService } from './keycloak.service.js';
import { UsersService, type ConsumerUserRecord } from '../users/users.service.js';

export const IS_PUBLIC = 'isPublic';
/** Rota acessível sem Bearer token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthedRequest extends Request {
  consumerUser?: ConsumerUserRecord;
}

/** Injeta o ConsumerUser resolvido pelo guard: `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.consumerUser) throw unauthorized();
  return req.consumerUser;
});

/**
 * Guard global: valida o JWT Keycloak (JWKS) e provisiona/carrega o
 * ConsumerUser correspondente (lazy provisioning por keycloakId).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectService(Reflector) private readonly reflector: Reflector,
    @InjectService(KeycloakService) private readonly keycloak: KeycloakService,
    @InjectService(UsersService) private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized();

    const claims = await this.keycloak.verify(token);
    req.consumerUser = await this.users.ensureFromClaims(claims);
    return true;
  }
}
