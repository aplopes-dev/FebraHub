import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { badRequest } from '../common/envelope.js';
import { money } from '../common/money.js';
import { InjectService } from '../common/inject.js';
import { KeycloakService } from '../auth/keycloak.service.js';
import { UsersService, toApiUser, type ConsumerUserRecord } from './users.service.js';

const SUBSCRIPTION_RENEWAL_DAYS = 30;
const DEFAULT_PLAN_NAME = 'CityBox+';
const DEFAULT_PLAN_PRICE = 19.9;
/** Benefícios padrão do plano (espelha o mock do web). */
const DEFAULT_BENEFITS = [
  'Frete grátis em todas as compras',
  'Entrega expressa prioritária',
  'Cashback de 5% em cada pedido',
  'Acesso antecipado a ofertas',
  'Suporte prioritário 24h',
];

function toApiSettings(user: ConsumerUserRecord) {
  return {
    pushOrdersEnabled: user.pushOrdersEnabled,
    pushPromoEnabled: user.pushPromoEnabled,
    emailPromoEnabled: user.emailPromoEnabled,
    darkTheme: user.darkTheme,
    language: user.language,
  };
}

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  email?: string;
}

export interface UpdateSettingsInput {
  pushOrdersEnabled?: boolean;
  pushPromoEnabled?: boolean;
  emailPromoEnabled?: boolean;
  darkTheme?: boolean;
  language?: string;
}

@Injectable()
export class MeService {
  private readonly db = getConsumerClient();

  constructor(
    @InjectService(KeycloakService) private readonly keycloak: KeycloakService,
    @InjectService(UsersService) private readonly users: UsersService,
  ) {}

  me(user: ConsumerUserRecord) {
    return { user: toApiUser(user) };
  }

  async update(user: ConsumerUserRecord, input: UpdateMeInput) {
    if (input.email !== undefined && input.email !== user.email) {
      // E-mail é a identidade no Keycloak — mudar só no BFF dessincronizaria o login.
      throw badRequest('Alteração de e-mail indisponível', 'email');
    }
    const updated = await this.db.consumerUser.update({
      where: { id: user.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    });
    this.users.invalidate(user.keycloakId);
    return { user: toApiUser(updated) };
  }

  async deleteAccount(user: ConsumerUserRecord) {
    await this.db.$transaction(async (tx) => {
      // Orders/ReturnRequests não têm onDelete: Cascade — remover manualmente.
      await tx.returnRequest.deleteMany({ where: { userId: user.id } });
      await tx.order.deleteMany({ where: { userId: user.id } });
      await tx.consumerUser.delete({ where: { id: user.id } });
    });
    await this.keycloak.deleteUser(user.keycloakId);
    this.users.invalidate(user.keycloakId);
    return { ok: true };
  }

  async updateAvatar(user: ConsumerUserRecord, avatarUrl: string) {
    const updated = await this.db.consumerUser.update({
      where: { id: user.id },
      data: { avatarUrl },
    });
    this.users.invalidate(user.keycloakId);
    return { avatarUrl, user: toApiUser(updated) };
  }

  settings(user: ConsumerUserRecord) {
    return toApiSettings(user);
  }

  async updateSettings(user: ConsumerUserRecord, input: UpdateSettingsInput) {
    const updated = await this.db.consumerUser.update({
      where: { id: user.id },
      data: {
        ...(input.pushOrdersEnabled !== undefined
          ? { pushOrdersEnabled: input.pushOrdersEnabled }
          : {}),
        ...(input.pushPromoEnabled !== undefined
          ? { pushPromoEnabled: input.pushPromoEnabled }
          : {}),
        ...(input.emailPromoEnabled !== undefined
          ? { emailPromoEnabled: input.emailPromoEnabled }
          : {}),
        ...(input.darkTheme !== undefined ? { darkTheme: input.darkTheme } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
      },
    });
    this.users.invalidate(user.keycloakId);
    return toApiSettings(updated);
  }

  private defaultRenewalDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + SUBSCRIPTION_RENEWAL_DAYS);
    return date;
  }

  async subscription(user: ConsumerUserRecord) {
    const sub = await this.db.subscription.findUnique({ where: { userId: user.id } });
    if (!sub) {
      return {
        isActive: false,
        planName: DEFAULT_PLAN_NAME,
        priceMonthly: DEFAULT_PLAN_PRICE,
        renewalDate: this.defaultRenewalDate().toISOString(),
        benefits: DEFAULT_BENEFITS,
      };
    }
    return {
      isActive: sub.isActive,
      planName: sub.planName,
      priceMonthly: money(sub.priceMonthly),
      renewalDate: sub.renewalDate.toISOString(),
      benefits: sub.benefits.length ? sub.benefits : DEFAULT_BENEFITS,
    };
  }

  async cancelSubscription(user: ConsumerUserRecord) {
    const sub = await this.db.subscription.upsert({
      where: { userId: user.id },
      update: { isActive: false },
      create: {
        userId: user.id,
        isActive: false,
        renewalDate: this.defaultRenewalDate(),
        benefits: DEFAULT_BENEFITS,
      },
    });
    return {
      isActive: false,
      cancelledAt: new Date().toISOString(),
      accessUntil: sub.renewalDate.toISOString(),
    };
  }
}
