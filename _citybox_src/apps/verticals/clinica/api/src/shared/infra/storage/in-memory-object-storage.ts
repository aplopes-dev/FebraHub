import {
  ObjectStorage,
  type PutObjectInput,
  type StoredObject,
} from '../../domain/storage/object-storage.interface';

export class InMemoryObjectStorage extends ObjectStorage {
  private readonly objects = new Map<string, StoredObject>();

  async put(input: PutObjectInput): Promise<void> {
    this.objects.set(input.key, {
      key: input.key,
      buffer: Buffer.from(input.buffer),
      mimeType: input.mimeType,
    });
  }

  async get(key: string): Promise<StoredObject> {
    const object = this.objects.get(key);
    if (!object) {
      throw new Error(`Object not found: ${key}`);
    }
    return {
      key: object.key,
      buffer: Buffer.from(object.buffer),
      mimeType: object.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }
}
