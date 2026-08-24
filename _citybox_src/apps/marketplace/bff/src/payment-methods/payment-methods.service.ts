import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { badRequest, notFound } from '../common/envelope.js';

const DEFAULT_CARD_LABEL = 'Novo cartão';

type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'UNKNOWN';

/** Mesma heurística do mock web (handlers/account.ts). */
export function detectBrand(number: string): CardBrand {
  const d = number.replace(/\D/g, '');
  if (d.startsWith('4')) return 'VISA';
  if (d.startsWith('5')) return 'MASTERCARD';
  if (d.startsWith('3')) return 'AMEX';
  if (d.startsWith('6')) return 'ELO';
  return 'UNKNOWN';
}

interface PaymentMethodRow {
  id: string;
  brand: string;
  lastFour: string;
  expiry: string;
  holderName: string;
  label: string;
  isDefault: boolean;
}

export interface CreatePaymentMethodInput {
  number: string;
  holderName: string;
  expiry: string;
  cvv?: string;
  label?: string;
  isDefault?: boolean;
}

function toApiPaymentMethod(row: PaymentMethodRow) {
  return {
    id: row.id,
    brand: row.brand as CardBrand,
    lastFour: row.lastFour,
    expiry: row.expiry,
    holderName: row.holderName,
    label: row.label,
    isDefault: row.isDefault,
  };
}

@Injectable()
export class PaymentMethodsService {
  private readonly db = getConsumerClient();

  async list(userId: string) {
    const rows = await this.db.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return { paymentMethods: rows.map(toApiPaymentMethod) };
  }

  /** NUNCA persiste número completo nem CVV — apenas brand + lastFour derivados. */
  async create(userId: string, input: CreatePaymentMethodInput) {
    const digits = input.number.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) {
      throw badRequest('Número de cartão inválido', 'number');
    }

    const paymentMethod = await this.db.$transaction(async (tx) => {
      const count = await tx.paymentMethod.count({ where: { userId } });
      const isDefault = count === 0 ? true : (input.isDefault ?? false);
      if (isDefault && count > 0) {
        await tx.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.paymentMethod.create({
        data: {
          userId,
          brand: detectBrand(digits),
          lastFour: digits.slice(-4),
          expiry: input.expiry,
          holderName: input.holderName,
          label: input.label ?? DEFAULT_CARD_LABEL,
          isDefault,
        },
      });
    });
    return { paymentMethod: toApiPaymentMethod(paymentMethod) };
  }

  async remove(userId: string, paymentMethodId: string) {
    const existing = await this.db.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });
    if (!existing) throw notFound('Cartão não encontrado');
    await this.db.paymentMethod.delete({ where: { id: paymentMethodId } });
  }

  async setDefault(userId: string, paymentMethodId: string) {
    const existing = await this.db.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });
    if (!existing) throw notFound('Cartão não encontrado');

    await this.db.$transaction(async (tx) => {
      await tx.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
      await tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: { isDefault: true },
      });
    });

    const { paymentMethods } = await this.list(userId);
    const paymentMethod = paymentMethods.find((p) => p.id === paymentMethodId);
    return { paymentMethod, paymentMethods };
  }
}
