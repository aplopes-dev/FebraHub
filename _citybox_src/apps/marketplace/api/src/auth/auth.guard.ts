import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { AuthService } from './auth.service.js';

/**
 * Guard de autenticação (ADR C-17, bloco 3).
 *
 * A verificação do token — issuer único e `azp` contra `KEYCLOAK_ALLOWED_AZP`
 * (invariante 1 do ADR C-16) — vive em `AuthService.verifyBearer`, e não aqui,
 * porque o `AuthMiddleware` autentica todas as rotas `/api/v1/*` pelo mesmo
 * método. Um `azp` validado só no guard deixaria a rota comum descoberta.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectService(AuthService) private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const header = req.headers.authorization ?? req.headers.Authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token obrigatório');
    }
    req.user = await this.auth.verifyBearer(header.slice(7));
    return true;
  }
}
