import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet } from 'jose';
import {
  allowedAuthorizedParties,
  verifyKeycloakJwt,
} from '../../keycloak/keycloak-jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  authenticatedUserFromJwtPayload,
  devBypassAuthenticatedUser,
  type AuthenticatedUser,
} from '../auth/authenticated-user';

/**
 * Guard de autenticação (ADR C-17, bloco 3).
 *
 * Um único issuer (`KEYCLOAK_ISSUER`, realm `citybox-imoveis`) e um único JWKS —
 * a versão anterior mantinha um mapa de JWKS por issuer para aceitar token do
 * realm compartilhado vindo de vários hosts.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

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

    // Dev bypass entra ANTES da verificação, nunca como fallback de erro.
    if (this.isDevBypass(header)) {
      req.user = devBypassAuthenticatedUser();
      return true;
    }

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token obrigatório');
    }

    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) throw new Error('KEYCLOAK_ISSUER não configurado');
    this.jwks ??= createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`),
    );

    try {
      const { payload } = await verifyKeycloakJwt(header.slice(7), this.jwks);

      // Invariante 1 do C-16: token de outro client do MESMO realm não passa.
      const azp = typeof payload.azp === 'string' ? payload.azp : '';
      if (!allowedAuthorizedParties().includes(azp)) {
        throw new UnauthorizedException(
          `Client não autorizado: ${azp || '(ausente)'}`,
        );
      }

      req.user = authenticatedUserFromJwtPayload(payload, {
        clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    return true;
  }

  private isDevBypass(header: string | undefined): boolean {
    if (process.env.NODE_ENV === 'production') return false;
    if (process.env.AUTH_DEV_BYPASS !== 'true') return false;
    return header === 'Bearer dev-admin';
  }
}
