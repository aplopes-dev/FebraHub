import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { parseMinioEndpoint } from './minio-endpoint.js';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    const { host, port } = parseMinioEndpoint();
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    if (process.env.NODE_ENV === 'production' && (!accessKey || !secretKey)) {
      throw new Error('MINIO_ACCESS_KEY e MINIO_SECRET_KEY são obrigatórios em produção');
    }
    this.client = new Minio.Client({
      endPoint: host,
      port,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: accessKey ?? 'citybox',
      secretKey: secretKey ?? 'citybox-minio-dev',
    });
    this.bucketName = process.env.MINIO_USERS_BUCKET ?? 'citybox-platform-users';
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch {
      // MinIO opcional em dev
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string,
  ): Promise<string> {
    const meta = mimeType ? { 'Content-Type': mimeType } : undefined;
    await this.client.putObject(
      this.bucketName,
      fileName,
      fileBuffer,
      fileBuffer.length,
      meta,
    );
    return fileName;
  }

  async getFile(fileName: string): Promise<Buffer> {
    const dataStream = await this.client.getObject(this.bucketName, fileName);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      dataStream.on('end', () => resolve(Buffer.concat(chunks)));
      dataStream.on('error', reject);
    });
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.client.removeObject(this.bucketName, fileName);
  }
}
