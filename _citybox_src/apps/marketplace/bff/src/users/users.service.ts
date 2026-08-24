import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import type { KeycloakClaims } from '../auth/keycloak.service.js';

export interface ConsumerUserRecord {
  id: string;
  keycloakId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isPlus: boolean;
  hasSeenOnboarding: boolean;
  pushOrdersEnabled: boolean;
  pushPromoEnabled: boolean;
  emailPromoEnabled: boolean;
  darkTheme: boolean;
  language: string;
}

export function toApiUser(user: ConsumerUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    avatarInitial: (user.name.trim()[0] ?? 'C').toUpperCase(),
    isPlus: user.isPlus,
    hasSeenOnboarding: user.hasSeenOnboarding,
  };
}

@Injectable()
export class UsersService {
  private readonly db = getConsumerClient();
  /** Cache local sub→user para evitar upsert em toda request. */
  private readonly bySub = new Map<string, { user: ConsumerUserRecord; expires: number }>();

  invalidate(keycloakId: string) {
    this.bySub.delete(keycloakId);
  }

  async ensureFromClaims(claims: KeycloakClaims): Promise<ConsumerUserRecord> {
    const cached = this.bySub.get(claims.sub);
    if (cached && cached.expires > Date.now()) return cached.user;

    const email = claims.email ?? `${claims.sub}@sem-email.citybox`;
    const name = claims.name ?? claims.preferred_username ?? email.split('@')[0];
    const user = await this.db.consumerUser.upsert({
      where: { keycloakId: claims.sub },
      update: {},
      create: {
        keycloakId: claims.sub,
        email,
        name,
        phone: claims.phone_number ?? '',
      },
    });
    this.bySub.set(claims.sub, { user, expires: Date.now() + 60_000 });
    return user;
  }

  async byId(id: string): Promise<ConsumerUserRecord | null> {
    return this.db.consumerUser.findUnique({ where: { id } });
  }
}
