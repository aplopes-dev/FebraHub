import type { WhatsappConnection } from '../entities/whatsapp-connection.entity';
import type { WhatsappConnectionStatus } from '../whatsapp.types';

export abstract class WhatsappConnectionRepository {
  abstract findByStoreId(storeId: string): Promise<WhatsappConnection | null>;
  abstract save(connection: WhatsappConnection): Promise<WhatsappConnection>;
  abstract delete(storeId: string): Promise<void>;
  abstract upsertStatus(
    storeId: string,
    patch: {
      status: WhatsappConnectionStatus;
      qrBase64?: string | null;
      phoneE164?: string | null;
      lastError?: string | null;
      authStateKey?: string;
    },
  ): Promise<WhatsappConnection>;
  abstract listConnectedStoreIds(): Promise<string[]>;
}
