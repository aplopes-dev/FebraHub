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
  /**
   * Cliente usado só para assinar URL de download.
   *
   * O cliente normal fala com `minio:9000`, o nome do serviço na rede do
   * compose — que não existe fora dela. Como a assinatura S3 v4 inclui o host,
   * não dá para trocar o endereço depois de assinar: a URL precisa nascer
   * apontando para o domínio público, e é isso que este segundo cliente faz.
   *
   * Sem MINIO_PUBLIC_URL configurado ele não existe, e o download continua
   * disponível pela própria API (/api/arquivos/:id/conteudo).
   */
  private readonly clientePublico: MinioClient | null;
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
      // path-style: com o bucket no host o MinIO precisaria de DNS curinga.
      pathStyle: true,
    });

    this.clientePublico = this.montarClientePublico();
  }

  private montarClientePublico(): MinioClient | null {
    const publico = this.cfg.minio.urlPublica;
    if (!publico) return null;
    try {
      const u = new URL(publico);
      return new MinioClient({
        endPoint: u.hostname,
        port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80,
        useSSL: u.protocol === 'https:',
        accessKey: this.cfg.minio.accessKey,
        secretKey: this.cfg.minio.secretKey,
        region: this.cfg.minio.region ?? 'us-east-1',
        pathStyle: true,
      });
    } catch (e) {
      this.logger.error(`MINIO_PUBLIC_URL inválida (${publico}): ${e}`);
      return null;
    }
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

  /**
   * URL pública estável de um objeto (sem assinatura). Só serve para chaves
   * cujo prefixo foi liberado para leitura anônima no bucket (ex.: `loja/`).
   * Monta `${MINIO_PUBLIC_URL}/${bucket}/${chave}`. Sem URL pública configurada
   * devolve `null` — o chamador decide o fallback (ex.: URL assinada curta).
   */
  urlObjetoPublico(chave: string): string | null {
    const base = this.cfg.minio.urlPublica;
    if (!base) return null;
    const raiz = base.replace(/\/+$/, '');
    const caminho = chave.split('/').map(encodeURIComponent).join('/');
    return `${raiz}/${this.cfg.minio.bucket}/${caminho}`;
  }

  /**
   * Garante leitura anônima (download) para um prefixo do bucket. Idempotente:
   * lê a policy atual, adiciona a regra do prefixo se faltar e regrava.
   * Usado para servir imagens de produto por URL pública estável.
   */
  async garantirPrefixoPublico(prefixo: string): Promise<void> {
    const bucket = this.cfg.minio.bucket;
    const recurso = `arn:aws:s3:::${bucket}/${prefixo.replace(/^\/+/, '')}*`;
    try {
      let policy: {
        Version: string;
        Statement: Array<{ Effect: string; Principal: unknown; Action: unknown; Resource: unknown }>;
      } = { Version: '2012-10-17', Statement: [] };
      try {
        const atual = await this.cliente.getBucketPolicy(bucket);
        if (atual) policy = JSON.parse(atual);
      } catch {
        /* bucket sem policy ainda: parte do template vazio */
      }
      const recursos = (r: unknown): string[] => (Array.isArray(r) ? (r as string[]) : [r as string]);
      const jaTem = (policy.Statement ?? []).some(
        (s) => s.Effect === 'Allow' && recursos(s.Resource).includes(recurso),
      );
      if (jaTem) return;
      policy.Statement = policy.Statement ?? [];
      policy.Statement.push({
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [recurso],
      });
      await this.cliente.setBucketPolicy(bucket, JSON.stringify(policy));
      this.logger.log(`prefixo público garantido: ${prefixo}`);
    } catch (e) {
      // Não é fatal: sem a policy a imagem só não abre por URL pública; o
      // upload em si já terá funcionado.
      this.logger.warn(`não foi possível liberar prefixo ${prefixo}: ${e}`);
    }
  }

  /** URL temporária. Curta de propósito: link de download não é permissão permanente. */
  async urlAssinada(chave: string, segundos = 300, nomeDownload?: string): Promise<string> {
    const params: Record<string, string> = {};
    if (nomeDownload) {
      const seguro = nomeDownload.replace(/["\\\r\n]/g, '_');
      params['response-content-disposition'] = `attachment; filename="${seguro}"`;
    }
    // Assina com o host público quando ele existe; o interno não resolve fora
    // da rede do compose e geraria um link que só funciona dentro do servidor.
    const assinador = this.clientePublico ?? this.cliente;
    return assinador.presignedGetObject(
      this.cfg.minio.bucket,
      chave,
      Math.min(Math.max(segundos, 30), 3600),
      params,
    );
  }

  /** Se a URL assinada é utilizável fora do servidor. O health check reporta. */
  get assinaUrlPublica(): boolean {
    return this.clientePublico !== null;
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
