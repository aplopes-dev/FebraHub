import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { createRemoteJWKSet } from 'jose';
import {
  allowedAuthorizedParties,
  keycloakIssuer,
  verifyKeycloakJwt,
} from '../common/auth/keycloak-jwt.js';
import { createHash } from 'node:crypto';
import type { PlatformPrisma } from '../database/platform.js';
import { PLATFORM_PRISMA } from '../platform/platform.module.js';
import type { AuthUser } from './auth.types.js';
import { mapKeycloakPayload } from './auth.mapper.js';

@Injectable()
export class AuthService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(@InjectService(PLATFORM_PRISMA) private readonly platform: PlatformPrisma) {}

  async verifyBearer(token: string): Promise<AuthUser> {
    if (token.startsWith('device:')) {
      return this.verifyDeviceToken(token.slice(7));
    }

    if (
      process.env.AUTH_DEV_BYPASS === 'true' &&
      process.env.NODE_ENV !== 'production' &&
      token === 'dev-admin'
    ) {
      // `platform_admin` era realm role global do `citybox-dev`; sumiu com o
      // ADR C-16. `platform.admin` é a permissão em si (ver common/permissions).
      return { sub: 'dev-admin', roles: ['platform.admin'], kind: 'user' };
    }

    if (!this.jwks) {
      // Em produção o issuer público pode redirecionar (http→https), e o jose
      // não segue redirects — KEYCLOAK_JWKS_URL permite apontar direto (rede interna).
      // Isto NÃO relaxa a validação: o `iss` do token continua sendo comparado
      // com o issuer único de `KEYCLOAK_ISSUER`.
      const jwksUrl =
        process.env.KEYCLOAK_JWKS_URL ?? `${keycloakIssuer()}/protocol/openid-connect/certs`;
      this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    const { payload } = await verifyKeycloakJwt(token, this.jwks);

    // Invariante 1 do ADR C-16: token de outro client do MESMO realm não passa.
    // A checagem fica aqui — e não só no AuthGuard — porque esta é a única
    // rotina de verificação: o `AuthMiddleware` (que autentica toda `/api/v1/*`)
    // e o `AuthGuard` chamam ambos `verifyBearer`. Validar apenas no guard
    // deixaria a rota comum sem a checagem. Divergência do bloco 3 do ADR C-17
    // registrada no `AGENTS.md` (§10).
    const azp = typeof payload.azp === 'string' ? payload.azp : '';
    if (!allowedAuthorizedParties().includes(azp)) {
      throw new UnauthorizedException(`Client não autorizado: ${azp || '(ausente)'}`);
    }

    return mapKeycloakPayload(payload as Record<string, unknown>, {
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
    });
  }

  async verifyDeviceToken(raw: string): Promise<AuthUser> {
    const hash = createHash('sha256').update(raw).digest('hex');
    const cred = await this.platform.deviceCredential.findFirst({
      where: { tokenHash: hash, active: true },
      include: { store: true },
    });
    if (!cred) throw new UnauthorizedException('Device token inválido');
    return {
      sub: cred.id,
      roles: ['device'],
      storeId: cred.storeId,
      kind: 'device',
    };
  }
}
