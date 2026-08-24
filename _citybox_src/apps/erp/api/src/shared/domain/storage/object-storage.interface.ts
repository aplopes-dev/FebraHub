export type StoredObject = {
  key: string;
  buffer: Buffer;
  mimeType: string;
};

export type PutObjectInput = {
  key: string;
  buffer: Buffer;
  mimeType: string;
};

export abstract class ObjectStorage {
  abstract put(input: PutObjectInput): Promise<void>;
  abstract get(key: string): Promise<StoredObject>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
}
