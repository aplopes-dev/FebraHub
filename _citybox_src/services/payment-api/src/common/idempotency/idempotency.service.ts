import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type IdempotencyAcquireResult =
  | { kind: 'new'; recordId: string }
  | { kind: 'replay'; body: unknown };

@Injectable()
export class IdempotencyService {
  private readonly ttlHours = Number(process.env.PAYMENTS_IDEMPOTENCY_TTL_HOURS ?? 24);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async acquire(input: {
    tenantId: string;
    sourceSystem: string;
    operation: string;
    key: string;
    requestHash: string;
  }): Promise<IdempotencyAcquireResult> {
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000);

    const existing = await this.prisma.db.idempotencyKey.findUnique({
      where: {
        tenantId_sourceSystem_key: {
          tenantId: input.tenantId,
          sourceSystem: input.sourceSystem,
          key: input.key,
        },
      },
    });

    if (existing?.status === 'COMPLETED' && existing.responseJson != null) {
      return { kind: 'replay', body: existing.responseJson };
    }
    if (existing?.status === 'IN_PROGRESS') {
      throw new ConflictException('Requisição idempotente ainda em processamento');
    }

    try {
      const record = await this.prisma.db.idempotencyKey.create({
        data: {
          tenantId: input.tenantId,
          sourceSystem: input.sourceSystem,
          operation: input.operation,
          key: input.key,
          requestHash: input.requestHash,
          status: 'IN_PROGRESS',
          expiresAt,
        },
      });

      return { kind: 'new', recordId: record.id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.db.idempotencyKey.findUnique({
          where: {
            tenantId_sourceSystem_key: {
              tenantId: input.tenantId,
              sourceSystem: input.sourceSystem,
              key: input.key,
            },
          },
        });
        if (raced?.status === 'COMPLETED' && raced.responseJson != null) {
          return { kind: 'replay', body: raced.responseJson };
        }
        throw new ConflictException('Requisição idempotente ainda em processamento');
      }
      throw error;
    }
  }

  async complete(recordId: string, response: unknown): Promise<void> {
    await this.prisma.db.idempotencyKey.update({
      where: { id: recordId },
      data: {
        status: 'COMPLETED',
        responseJson: response as object,
      },
    });
  }

  async fail(recordId: string): Promise<void> {
    await this.prisma.db.idempotencyKey.delete({ where: { id: recordId } }).catch(() => undefined);
  }
}
