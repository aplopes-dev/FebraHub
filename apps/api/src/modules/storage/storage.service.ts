import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Configuracao } from '../../config/configuracao';

export interface ArquivoParaSubir {
  nomeOriginal: string;
  mimeDeclarado: string;
  conteudo: Buffer;
}

export interface MetadadosArquivo {
  chave: string;
  tamanho: number;
  mime: string;
  atualizadoEm: Date;
  etag: string;
}

/**
 * Camada de storage. O resto do sistema fala com esta interface, nunca com o
 * SDK do MinIO — trocar por S3 ou R2 depois é mudar só este arquivo.
 *
 * O frontend nunca recebe credencial: sobe pela API e baixa por URL assinada
 * de vida curta. Era assim que o Supabase Storage funcionava e continua sendo.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly cliente: MinioClient;
  private readonly cfg: Configuracao;

  constructor(config: ConfigService) {
    this.cfg = config.get<Configuracao>('app')!;
    this.cliente = new MinioClient({
      endPoint: this.cfg.minio.endPoint,
      port: this.cfg.minio.port,
      useSSL: this.cfg.minio.useSSL,
      accessKey: this.cfg.minio.accessKey,
      secretKey: this.cfg.minio.secretKey,
      region: this.cfg.minio.region ?? 'us-east-1',
      // path-style: com bucket no host o MinIO precisaria de DNS curinga.
      pathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const existe = await this.cliente.bucketExists(this.cfg.minio.bucket);
      if (!existe) {
        await this.cliente.makeBucket(this.cfg.minio.bucket, this.cfg.minio.region ?? 'us-east-1');
        this.logger.log(`bucket ${this.cfg.minio.bucket} criado`);
      }
    } catch (e) {
      // Storage fora do ar não pode impedir a API de subir: os hubs não
      // dependem dele, e o health check já reporta o estado.
      this.logger.error(`MinIO indisponível na subida: ${e}`);
    }
  }

  async ping(): Promise<boolean> {
    await this.cliente.bucketExists(this.cfg.minio.bucket);
    return true;
  }

  /**
   * Monta a chave do objeto. Nada do nome enviado pelo cliente entra no
   * caminho: `../../etc/passwd` como nome de arquivo é o caso clássico.
   * O nome original é guardado no banco, o objeto vive sob um UUID.
   */
  montarChave(pasta: string, nomeOriginal: string): string {
    const pastaLimpa = pasta.replace(/[^a-z0-9/_-]/gi, '').replace(/\.\.+/g, '').replace(/^\/+/, '');
    const ext = extname(nomeOriginal).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 12);
    const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    return `${pastaLimpa || 'geral'}/${hoje}/${randomUUID()}${ext}`;
  }

  async upload(chave: string, conteudo: Buffer, mime: string): Promise<{ etag: string; sha256: string }> {
    const sha256 = createHash('sha256').update(conteudo).digest('hex');
    try {
      const r = await this.cliente.putObject(this.cfg.minio.bucket, chave, conteudo, conteudo.length, {
        'Content-Type': mime,
        'x-amz-meta-sha256': sha256,
      });
      return { etag: r.etag, sha256 };
    } catch (e) {
      this.logger.error(`upload ${chave}: ${e}`);
      throw new ServiceUnavailableException({
        codigo: 'STORAGE_INDISPONIVEL',
        message: 'Não foi possível gravar o arquivo',
      });
    }
  }

  async baixar(chave: string): Promise<Buffer> {
    const stream = await this.cliente.getObject(this.cfg.minio.bucket, chave);
    const partes: Buffer[] = [];
    for await (const p of stream) partes.push(p as Buffer);
    return Buffer.concat(partes);
  }

  /** URL temporária. Curta de propósito: link de download não é permissão permanente. */
  async urlAssinada(chave: string, segundos = 300, nomeDownload?: string): Promise<string> {
    const params: Record<string, string> = {};
    if (nomeDownload) {
      const seguro = nomeDownload.replace(/["\\\r\n]/g, '_');
      params['response-content-disposition'] = `attachment; filename="${seguro}"`;
    }
    return this.cliente.presignedGetObject(
      this.cfg.minio.bucket,
      chave,
      Math.min(Math.max(segundos, 30), 3600),
      params,
    );
  }

  async excluir(chave: string): Promise<void> {
    await this.cliente.removeObject(this.cfg.minio.bucket, chave);
  }

  async existe(chave: string): Promise<boolean> {
    try {
      await this.cliente.statObject(this.cfg.minio.bucket, chave);
      return true;
    } catch {
      return false;
    }
  }

  async copiar(origem: string, destino: string): Promise<void> {
    await this.cliente.copyObject(
      this.cfg.minio.bucket,
      destino,
      `/${this.cfg.minio.bucket}/${origem}`,
    );
  }

  async metadados(chave: string): Promise<MetadadosArquivo> {
    const s = await this.cliente.statObject(this.cfg.minio.bucket, chave);
    return {
      chave,
      tamanho: s.size,
      mime: (s.metaData?.['content-type'] as string) ?? 'application/octet-stream',
      atualizadoEm: s.lastModified,
      etag: s.etag,
    };
  }

  validarTamanho(bytes: number): void {
    if (bytes <= 0) {
      throw new BadRequestException({ codigo: 'ARQUIVO_VAZIO', message: 'Arquivo vazio' });
    }
    if (bytes > this.cfg.uploadMaxBytes) {
      const mb = Math.floor(this.cfg.uploadMaxBytes / 1024 / 1024);
      throw new BadRequestException({
        codigo: 'ARQUIVO_GRANDE',
        message: `Arquivo acima do limite de ${mb} MB`,
      });
    }
  }
}
