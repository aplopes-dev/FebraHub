import { Inject, Injectable } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { sanitizePciForStorage } from '../../common/security/pci-payload.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuditLogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(input: {
    tenantId?: string;
    actor?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.db.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actor: input.actor,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadataJson: toJson(sanitizePciForStorage(input.metadata)),
        ipAddress: input.ipAddress,
      },
    });
  }
}

@Injectable()
export class ProviderRequestService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(input: {
    tenantId: string;
    provider: ProviderType;
    operation: string;
    chargeId?: string;
    paymentId?: string;
    requestPayload?: unknown;
    responsePayload?: unknown;
    status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
    httpStatus?: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.prisma.db.providerRequest.create({
      data: {
        tenantId: input.tenantId,
        provider: input.provider,
        operation: input.operation,
        chargeId: input.chargeId,
        paymentId: input.paymentId,
        requestPayload: sanitizePciForStorage(input.requestPayload) as object | undefined,
        responsePayload: sanitizePciForStorage(input.responsePayload) as object | undefined,
        status: input.status,
        httpStatus: input.httpStatus,
        errorMessage: input.errorMessage,
      },
    });
  }
}
