import { WhatsappConnection } from '../domain/entities/whatsapp-connection.entity';
import type { WhatsappConnectionRepository } from '../domain/repositories/whatsapp-connection.repository.interface';
import type { WhatsappConnectionStatus } from '../domain/whatsapp.types';

export class InMemoryWhatsappConnectionRepository implements WhatsappConnectionRepository {
  private readonly byStore = new Map<string, WhatsappConnection>();

  findByStoreId(storeId: string): Promise<WhatsappConnection | null> {
    return Promise.resolve(this.byStore.get(storeId) ?? null);
  }

  save(connection: WhatsappConnection): Promise<WhatsappConnection> {
    this.byStore.set(connection.storeId, connection);
    return Promise.resolve(connection);
  }

  delete(storeId: string): Promise<void> {
    this.byStore.delete(storeId);
    return Promise.resolve();
  }

  upsertStatus(
    storeId: string,
    patch: {
      status: WhatsappConnectionStatus;
      qrBase64?: string | null;
      phoneE164?: string | null;
      lastError?: string | null;
      authStateKey?: string;
    },
  ): Promise<WhatsappConnection> {
    const existing =
      this.byStore.get(storeId) ?? WhatsappConnection.create({ storeId });
    const next = WhatsappConnection.with({
      storeId,
      status: patch.status,
      phoneE164:
        patch.phoneE164 !== undefined ? patch.phoneE164 : existing.phoneE164,
      lastError:
        patch.lastError !== undefined ? patch.lastError : existing.lastError,
      authStateKey: patch.authStateKey ?? existing.authStateKey,
      qrBase64:
        patch.qrBase64 !== undefined ? patch.qrBase64 : existing.qrBase64,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.byStore.set(storeId, next);
    return Promise.resolve(next);
  }

  listConnectedStoreIds(): Promise<string[]> {
    return Promise.resolve(
      [...this.byStore.values()]
        .filter((c) => c.status === 'connected')
        .map((c) => c.storeId),
    );
  }
}
