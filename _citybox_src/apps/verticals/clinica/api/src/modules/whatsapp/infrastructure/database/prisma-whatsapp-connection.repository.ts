import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { WhatsappConnection } from '../../domain/entities/whatsapp-connection.entity';
import { WhatsappConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.interface';
import type { WhatsappConnectionStatus } from '../../domain/whatsapp.types';

@Injectable()
export class PrismaWhatsappConnectionRepository extends WhatsappConnectionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<WhatsappConnection | null> {
    const row = await this.prisma.whatsappConnection.findUnique({
      where: { storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(connection: WhatsappConnection): Promise<WhatsappConnection> {
    const row = await this.prisma.whatsappConnection.upsert({
      where: { storeId: connection.storeId },
      create: {
        storeId: connection.storeId,
        status: connection.status,
        phoneE164: connection.phoneE164,
        lastError: connection.lastError,
        authStateKey: connection.authStateKey,
        qrBase64: connection.qrBase64,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      },
      update: {
        status: connection.status,
        phoneE164: connection.phoneE164,
        lastError: connection.lastError,
        authStateKey: connection.authStateKey,
        qrBase64: connection.qrBase64,
        updatedAt: connection.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string): Promise<void> {
    await this.prisma.whatsappConnection.deleteMany({ where: { storeId } });
  }

  async upsertStatus(
    storeId: string,
    patch: {
      status: WhatsappConnectionStatus;
      qrBase64?: string | null;
      phoneE164?: string | null;
      lastError?: string | null;
      authStateKey?: string;
    },
  ): Promise<WhatsappConnection> {
    const existing = await this.findByStoreId(storeId);
    const connection =
      existing ??
      WhatsappConnection.create({
        storeId,
        authStateKey: patch.authStateKey ?? `whatsapp/${storeId}`,
      });

    if (patch.status === 'qr_pending' && patch.qrBase64) {
      connection.markQrPending(patch.qrBase64);
    } else if (patch.status === 'connected') {
      connection.markConnected(patch.phoneE164 ?? null);
    } else if (patch.status === 'disconnected') {
      connection.markDisconnected();
    } else if (patch.status === 'error') {
      connection.markError(patch.lastError ?? 'Erro desconhecido');
    }

    if (patch.authStateKey) {
      connection.props.authStateKey = patch.authStateKey;
    }

    return this.save(connection);
  }

  async listConnectedStoreIds(): Promise<string[]> {
    const rows = await this.prisma.whatsappConnection.findMany({
      where: { status: 'connected' },
      select: { storeId: true },
    });
    return rows.map((row) => row.storeId);
  }

  private toEntity(row: {
    storeId: string;
    status: WhatsappConnectionStatus;
    phoneE164: string | null;
    lastError: string | null;
    authStateKey: string;
    qrBase64: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WhatsappConnection {
    return WhatsappConnection.with({
      storeId: row.storeId,
      status: row.status,
      phoneE164: row.phoneE164,
      lastError: row.lastError,
      authStateKey: row.authStateKey,
      qrBase64: row.qrBase64,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
