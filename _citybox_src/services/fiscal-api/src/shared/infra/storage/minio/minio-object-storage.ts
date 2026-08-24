import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import {
  ObjectStorage,
  type PutObjectInput,
  type StoredObject,
} from '../../../domain/storage/object-storage.interface';
import { StorageUnavailableError } from '../../../domain/storage/storage-unavailable.error';
import { parseMinioEndpoint } from './minio-endpoint';

@Injectable()
export class MinioObjectStorage extends ObjectStorage implements OnModuleInit {
  private client: Minio.Client;
  private readonly bucketName: string;

  constructor() {
    super();
    const { host, port } = parseMinioEndpoint();
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    if (process.env.NODE_ENV === 'production' && (!accessKey || !secretKey)) {
      throw new Error(
        'MINIO_ACCESS_KEY e MINIO_SECRET_KEY são obrigatórios em produção',
      );
    }
    this.client = new Minio.Client({
      endPoint: host,
      port,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      // Defaults alinhados a infra/minio/.env (MINIO_ROOT_USER/PASSWORD)
      accessKey: accessKey ?? 'aplopes',
      secretKey: secretKey ?? 'citybox-minio-dev',
    });
    this.bucketName = process.env.MINIO_BUCKET ?? 'fiscal';
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch {
      // MinIO opcional em dev — falhas aparecem nas operações
    }
  }

  async put(input: PutObjectInput): Promise<void> {
    try {
      await this.client.putObject(
        this.bucketName,
        input.key,
        input.buffer,
        input.buffer.length,
        { 'Content-Type': input.mimeType },
      );
    } catch (error) {
      throw new StorageUnavailableError(
        MinioObjectStorage.name,
        (error as Error).message,
      );
    }
  }

  async get(key: string): Promise<StoredObject> {
    try {
      const stat = await this.client.statObject(this.bucketName, key);
      const dataStream = await this.client.getObject(this.bucketName, key);
      const buffer = await this.streamToBuffer(dataStream);
      const mimeType =
        (stat.metaData?.['content-type'] as string | undefined) ??
        'application/octet-stream';
      return { key, buffer, mimeType };
    } catch (error) {
      throw new StorageUnavailableError(
        MinioObjectStorage.name,
        (error as Error).message,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, key);
    } catch (error) {
      throw new StorageUnavailableError(
        MinioObjectStorage.name,
        (error as Error).message,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucketName, key);
      return true;
    } catch {
      return false;
    }
  }

  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
