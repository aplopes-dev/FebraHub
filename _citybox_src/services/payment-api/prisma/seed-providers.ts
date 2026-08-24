import { createCipheriv, randomBytes } from 'node:crypto';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import type { EnvironmentType, ProviderType } from '../src/generated/prisma/enums.js';
import { deriveAes256Key, resolveEncryptionKeyMaterial } from '../src/common/crypto/derive-key.js';

function encryptCredentials(plaintext: string): string {
  const key = deriveAes256Key(resolveEncryptionKeyMaterial());
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function resolveEnv(name: string): EnvironmentType {
  const value = process.env[name]?.trim().toLowerCase();
  return value === 'production' ? 'PRODUCTION' : 'SANDBOX';
}

async function upsertProviderAccount(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    merchantId: string;
    provider: ProviderType;
    apiKey: string;
    environment: EnvironmentType;
    isDefault: boolean;
  },
) {
  const credentialsEncrypted = encryptCredentials(JSON.stringify({ apiKey: input.apiKey }));
  const existing = await prisma.providerAccount.findFirst({
    where: {
      tenantId: input.tenantId,
      merchantId: input.merchantId,
      provider: input.provider,
    },
  });

  if (existing) {
    await prisma.providerAccount.update({
      where: { id: existing.id },
      data: {
        credentialsEncrypted,
        environment: input.environment,
        isDefault: input.isDefault,
        status: 'ACTIVE',
      },
    });
    return;
  }

  if (input.isDefault) {
    await prisma.providerAccount.updateMany({
      where: { tenantId: input.tenantId, merchantId: input.merchantId },
      data: { isDefault: false },
    });
  }

  await prisma.providerAccount.create({
    data: {
      tenantId: input.tenantId,
      merchantId: input.merchantId,
      provider: input.provider,
      environment: input.environment,
      credentialsEncrypted,
      isDefault: input.isDefault,
      status: 'ACTIVE',
    },
  });
}

export async function seedProviderAccounts(
  prisma: PrismaClient,
  tenantId: string,
  merchantId: string,
): Promise<void> {
  const asaasKey = process.env.ASAAS_API_KEY?.trim();
  const pagbankToken = process.env.PAGBANK_TOKEN?.trim();

  if (asaasKey) {
    await upsertProviderAccount(prisma, {
      tenantId,
      merchantId,
      provider: 'ASAAS',
      apiKey: asaasKey,
      environment: resolveEnv('ASAAS_ENV'),
      isDefault: !pagbankToken,
    });
  }

  if (pagbankToken) {
    await upsertProviderAccount(prisma, {
      tenantId,
      merchantId,
      provider: 'PAGBANK',
      apiKey: pagbankToken,
      environment: resolveEnv('PAGBANK_ENV'),
      isDefault: Boolean(pagbankToken),
    });
  }

  if (asaasKey && pagbankToken) {
    await prisma.providerAccount.updateMany({
      where: { tenantId, merchantId, provider: 'ASAAS' },
      data: { isDefault: false },
    });
    await prisma.providerAccount.updateMany({
      where: { tenantId, merchantId, provider: 'PAGBANK' },
      data: { isDefault: true },
    });
  }
}
