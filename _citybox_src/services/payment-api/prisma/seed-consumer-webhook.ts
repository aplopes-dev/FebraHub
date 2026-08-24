import { createCipheriv, randomBytes } from 'node:crypto';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { deriveAes256Key, resolveEncryptionKeyMaterial } from '../src/common/crypto/derive-key.js';

const CORE_API_WEBHOOK_EVENTS = [
  'payment.payment.received',
  'payment.payment.captured',
  'payment.payment.settled',
];

function encryptSecret(plaintext: string): string {
  const key = deriveAes256Key(resolveEncryptionKeyMaterial());
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function resolveCoreApiWebhookUrl(): string | null {
  const explicit = process.env.CORE_API_INTERNAL_WEBHOOK_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.CORE_API_BASE_URL?.trim();
  if (base) {
    return `${base.replace(/\/$/, '')}/api/v1/internal/payments/webhooks`;
  }

  // payment-api no Docker (rede citybox-platform) → core-api container
  if (process.env.PAYMENT_API_IN_DOCKER === 'true') {
    return 'http://citybox_core_api:3101/api/v1/internal/payments/webhooks';
  }

  return 'http://127.0.0.1:3101/api/v1/internal/payments/webhooks';
}

export async function seedConsumerWebhooks(prisma: PrismaClient, tenantId: string): Promise<void> {
  const url = resolveCoreApiWebhookUrl();
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) {
    console.warn(
      'Seed consumer webhook: CORE_API_INTERNAL_WEBHOOK_URL (ou CORE_API_BASE_URL) e PAYMENTS_WEBHOOK_SECRET são necessários — pulando',
    );
    return;
  }

  if (secret.length < 32) {
    throw new Error('PAYMENTS_WEBHOOK_SECRET deve ter ao menos 32 caracteres');
  }

  const existing = await prisma.consumerWebhook.findFirst({
    where: {
      tenantId,
      sourceSystem: 'core-api',
      url,
    },
  });

  const data = {
    url,
    secretEncrypted: encryptSecret(secret),
    sourceSystem: 'core-api',
    eventTypes: CORE_API_WEBHOOK_EVENTS,
    status: 'ACTIVE' as const,
  };

  if (existing) {
    await prisma.consumerWebhook.update({
      where: { id: existing.id },
      data,
    });
    console.log(`Seed consumer webhook: core-api atualizado → ${url}`);
    return;
  }

  await prisma.consumerWebhook.create({
    data: {
      tenantId,
      ...data,
    },
  });
  console.log(`Seed consumer webhook: core-api registrado → ${url}`);
}
