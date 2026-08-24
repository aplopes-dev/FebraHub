import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiError, badRequest } from '../common/envelope.js';
import { CacheService } from '../cache/cache.service.js';
import { getConsumerClient } from '../database/consumer.js';
import {
  UsersService,
  toApiUser,
  type ConsumerUserRecord,
} from '../users/users.service.js';
import { KeycloakService, type KeycloakTokens } from './keycloak.service.js';
import type {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  OnboardingDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto.js';

const PASSWORD_RESET_TTL_SEC = 900;
const passwordResetKey = (token: string) => `pwreset:${token}`;

@Injectable()
export class AuthService {
  private readonly db = getConsumerClient();

  constructor(
    @InjectService(KeycloakService) private readonly keycloak: KeycloakService,
    @InjectService(UsersService) private readonly users: UsersService,
    @InjectService(CacheService) private readonly cache: CacheService,
  ) {}

  private authPayload(tokens: KeycloakTokens, user: ConsumerUserRecord) {
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      user: toApiUser(user),
    };
  }

  async login(dto: LoginDto) {
    const tokens = await this.keycloak.passwordGrant(dto.account, dto.password);
    const claims = await this.keycloak.verify(tokens.access_token);
    let user = await this.users.ensureFromClaims(claims);

    if (dto.hasSeenOnboarding === true && !user.hasSeenOnboarding) {
      user = await this.db.consumerUser.update({
        where: { keycloakId: claims.sub },
        data: { hasSeenOnboarding: true },
      });
      this.users.invalidate(claims.sub);
    }
    return this.authPayload(tokens, user);
  }

  async register(dto: RegisterDto) {
    const [firstName, ...rest] = dto.name.trim().split(/\s+/);
    await this.keycloak.createUser({
      email: dto.email,
      password: dto.password,
      firstName: firstName ?? dto.name,
      lastName: rest.join(' ') || undefined,
      phone: dto.phone,
    });

    const tokens = await this.keycloak.passwordGrant(dto.email, dto.password);
    const claims = await this.keycloak.verify(tokens.access_token);
    await this.users.ensureFromClaims(claims);

    // Grava os dados reais do formulário (claims podem vir incompletas).
    const user = await this.db.consumerUser.update({
      where: { keycloakId: claims.sub },
      data: {
        name: dto.name.trim(),
        phone: dto.phone ?? '',
        hasSeenOnboarding: dto.hasSeenOnboarding ?? false,
      },
    });
    this.users.invalidate(claims.sub);
    return this.authPayload(tokens, user);
  }

  loginGoogle(): never {
    throw new ApiError(501, 'NOT_IMPLEMENTED', 'Login Google ainda não disponível');
  }

  async refresh(refreshToken: string) {
    const tokens = await this.keycloak.refreshGrant(refreshToken);
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    };
  }

  async logout(dto: LogoutDto) {
    if (dto.refreshToken) await this.keycloak.logout(dto.refreshToken);
    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const token = randomUUID();
    await this.cache.set(passwordResetKey(token), dto.email, PASSWORD_RESET_TTL_SEC);
    // Resposta sempre genérica — não revela se o e-mail existe.
    return { message: 'Se o e-mail existir, enviamos um link de redefinição.', sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.confirmPassword !== undefined && dto.confirmPassword !== dto.password) {
      throw badRequest('As senhas não conferem', 'confirmPassword');
    }
    const key = passwordResetKey(dto.token);
    const email = await this.cache.get<string>(key);
    if (!email) throw badRequest('Token inválido ou expirado', 'token');

    const keycloakId = await this.keycloak.findUserIdByEmail(email);
    if (!keycloakId) throw badRequest('Token inválido ou expirado', 'token');

    await this.keycloak.setUserPassword(keycloakId, dto.password);
    await this.cache.del(key);
    return { message: 'Senha alterada com sucesso' };
  }

  /** Onboarding pré-login: nada a persistir no BFF (o device guarda o estado). */
  onboarding(dto: OnboardingDto) {
    return { ok: true, hasSeenOnboarding: Boolean(dto.hasSeenOnboarding ?? dto.seen) };
  }

  async setOnboarding(user: ConsumerUserRecord, hasSeenOnboarding: boolean) {
    const updated = await this.db.consumerUser.update({
      where: { id: user.id },
      data: { hasSeenOnboarding },
    });
    this.users.invalidate(user.keycloakId);
    return { hasSeenOnboarding: updated.hasSeenOnboarding, user: toApiUser(updated) };
  }
}
