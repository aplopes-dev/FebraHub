import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EnvironmentType, ProviderType } from '../../generated/prisma/enums.js';
import { EncryptionService } from '../../common/crypto/encryption.service.js';
import type { ProviderCredentials } from '../providers/payment-provider.interface.js';
import { credentialsFromEnv } from '../providers/payment-provider.factory.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateProviderAccountDto,
  UpdateProviderAccountDto,
} from '../customers/dto/customer.dto.js';

@Injectable()
export class ProviderAccountsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EncryptionService) private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, merchantId: string, dto: CreateProviderAccountDto) {
    await this.assertMerchant(tenantId, merchantId);
    if (dto.isDefault) {
      await this.prisma.db.providerAccount.updateMany({
        where: { tenantId, merchantId },
        data: { isDefault: false },
      });
    }
    return this.prisma.db.providerAccount.create({
      data: {
        tenantId,
        merchantId,
        provider: dto.provider,
        environment: dto.environment,
        credentialsEncrypted: this.encryption.encrypt(JSON.stringify(dto.credentials)),
        webhookSecretEncrypted: dto.webhookSecret
          ? this.encryption.encrypt(dto.webhookSecret)
          : null,
        isDefault: dto.isDefault ?? false,
        status: 'ACTIVE',
      },
    });
  }

  async list(tenantId: string, merchantId: string) {
    await this.assertMerchant(tenantId, merchantId);
    return this.prisma.db.providerAccount.findMany({
      where: { tenantId, merchantId },
      select: {
        id: true,
        provider: true,
        environment: true,
        status: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProviderAccountDto) {
    const account = await this.get(tenantId, id);
    if (dto.isDefault) {
      await this.prisma.db.providerAccount.updateMany({
        where: { tenantId, merchantId: account.merchantId },
        data: { isDefault: false },
      });
    }
    return this.prisma.db.providerAccount.update({
      where: { id },
      data: {
        credentialsEncrypted: dto.credentials
          ? this.encryption.encrypt(JSON.stringify(dto.credentials))
          : undefined,
        webhookSecretEncrypted: dto.webhookSecret
          ? this.encryption.encrypt(dto.webhookSecret)
          : undefined,
        isDefault: dto.isDefault,
      },
    });
  }

  async test(tenantId: string, id: string) {
    const account = await this.get(tenantId, id);
    this.encryption.decrypt(account.credentialsEncrypted);
    return { ok: true, provider: account.provider, environment: account.environment };
  }

  async getDefaultProvider(tenantId: string, merchantId: string) {
    const account = await this.prisma.db.providerAccount.findFirst({
      where: { tenantId, merchantId, isDefault: true, status: 'ACTIVE' },
    });
    if (account) return account.provider;
    if (credentialsFromEnv('PAGBANK')) return 'PAGBANK';
    if (credentialsFromEnv('ASAAS')) return 'ASAAS';
    if (credentialsFromEnv('INFINITE_PAY')) return 'INFINITE_PAY';
    if (credentialsFromEnv('STONE')) return 'STONE';
    return 'STUB';
  }

  async getActiveAccount(tenantId: string, merchantId: string, provider: ProviderType) {
    return this.prisma.db.providerAccount.findFirst({
      where: { tenantId, merchantId, provider, status: 'ACTIVE' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  resolveCredentials(
    provider: ProviderType,
    account?: { credentialsEncrypted: string; environment: EnvironmentType } | null,
  ): ProviderCredentials | null {
    if (account) {
      const decrypted = JSON.parse(this.encryption.decrypt(account.credentialsEncrypted)) as {
        apiKey?: string;
      };
      if (decrypted.apiKey) {
        return {
          apiKey: decrypted.apiKey,
          environment: account.environment,
        };
      }
    }
    return credentialsFromEnv(provider);
  }

  private async get(tenantId: string, id: string) {
    const account = await this.prisma.db.providerAccount.findFirst({ where: { id, tenantId } });
    if (!account) throw new NotFoundException('Provider account não encontrada');
    return account;
  }

  private async assertMerchant(tenantId: string, merchantId: string) {
    const merchant = await this.prisma.db.merchant.findFirst({ where: { id: merchantId, tenantId } });
    if (!merchant) throw new NotFoundException('Merchant não encontrado');
  }
}
