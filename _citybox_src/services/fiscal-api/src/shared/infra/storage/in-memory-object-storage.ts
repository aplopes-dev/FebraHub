import {
  ObjectStorage,
  type PutObjectInput,
  type StoredObject,
} from '../../domain/storage/object-storage.interface';

export class InMemoryObjectStorage extends ObjectStorage {
  private readonly objects = new Map<string, StoredObject>();

  put(input: PutObjectInput): Promise<void> {
    this.objects.set(input.key, {
      key: input.key,
      buffer: Buffer.from(input.buffer),
      mimeType: input.mimeType,
    });
    return Promise.resolve();
  }

  get(key: string): Promise<StoredObject> {
    const object = this.objects.get(key);
    if (!object) {
      return Promise.reject(new Error(`Object not found: ${key}`));
    }
    return Promise.resolve({
      key: object.key,
      buffer: Buffer.from(object.buffer),
      mimeType: object.mimeType,
    });
  }

  delete(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  exists(key: string): Promise<boolean> {
    return Promise.resolve(this.objects.has(key));
  }
}
