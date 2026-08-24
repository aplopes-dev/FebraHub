import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  allowedAuthorizedParties,
  verifyKeycloakJwt,
} from '../../keycloak/keycloak-jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  applyActingSub,
  authenticatedUserFromJwtPayload,
  devBypassAuthenticatedUser,
  type AuthenticatedUser,
} from '../auth/authenticated-user';

/**
 * Serviço multi-issuer por exceção (ADR C-16). O cache de JWKS mora em
 * `keycloak-jwt.ts`, indexado por issuer — não aqui, porque um único `jwks`
 * não serve a realms diferentes.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: AuthenticatedUser;
    }>();
    const header = req.headers.authorization ?? req.headers.Authorization;
    if (!header?.startsWith('Bearer ')) {
      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.AUTH_DEV_BYPASS === 'true' &&
        header === 'Bearer dev-admin'
      ) {
        req.user = devBypassAuthenticatedUser();
        return true;
      }
      throw new UnauthorizedException('Bearer token obrigatório');
    }
    const token = header.slice(7);
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_DEV_BYPASS === 'true' &&
      token === 'dev-admin'
    ) {
      req.user = devBypassAuthenticatedUser();
      return true;
    }
    try {
      // Valida assinatura + issuer contra a allowlist (`KEYCLOAK_ALLOWED_ISSUERS`).
      const { payload } = await verifyKeycloakJwt(token);

      // Invariante 1 do ADR C-16: token de outro client não passa. Aqui a
      // allowlist é por client dos sistemas consumidores, não do próprio realm.
      const azp = typeof payload.azp === 'string' ? payload.azp : '';
      if (!allowedAuthorizedParties().includes(azp)) {
        throw new UnauthorizedException(
          `Client não autorizado: ${azp || '(ausente)'}`,
        );
      }

      // BUG-01 (2026-08-13): `X-Acting-Sub` só é lido aqui — sem isto, o
      // import de `applyActingSub` ficava morto e o proxy erp-web (que já
      // manda o header desde essa correção) tinha o `sub` real do usuário
      // ignorado sempre que autenticava como `citybox-fiscal-service`/
      // `fiscal-m2m`, caindo no fail-closed `sub: 'unknown'` para TODA
      // chamada de série/sequência — achado ao rodar o lint desta feature
      // (`applyActingSub` "defined but never used"), não algo desta feature
      // introduziu.
      const actingSub =
        req.headers['x-acting-sub'] ?? req.headers['X-Acting-Sub'];
      req.user = applyActingSub(
        authenticatedUserFromJwtPayload(payload, { clientId: azp }),
        actingSub,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    return true;
  }
}
