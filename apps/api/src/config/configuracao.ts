/**
 * Configuração da API, validada uma vez na subida.
 *
 * Um segredo faltando aqui é falha de boot, não erro em produção às 3h da
 * manhã: sem JWT_ACCESS_SECRET o processo não sobe, em vez de assinar token
 * com string vazia e aceitar qualquer sessão.
 */
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class VariaveisAmbiente {
  @IsString()
  NODE_ENV!: string;

  @IsInt()
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  // 32 caracteres é o piso para HS256 não ser força-bruta de fim de semana.
  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET precisa de ao menos 32 caracteres' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET precisa de ao menos 32 caracteres' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @MinLength(32, { message: 'COOKIE_SECRET precisa de ao menos 32 caracteres' })
  COOKIE_SECRET!: string;

  @IsString()
  MINIO_ENDPOINT!: string;

  @IsInt()
  MINIO_PORT!: number;

  @IsBoolean()
  MINIO_USE_SSL!: boolean;

  @IsString()
  MINIO_ACCESS_KEY!: string;

  @IsString()
  MINIO_SECRET_KEY!: string;

  @IsString()
  MINIO_BUCKET!: string;

  @IsString()
  @IsOptional()
  MINIO_REGION?: string;

  @IsString()
  CORS_ORIGIN!: string;

  @IsString()
  @IsOptional()
  APP_URL?: string;

  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  // Token de máquina dos ETLs. Sem ele, /ingest fica fechado — o que é o
  // default seguro: melhor ETL parado do que rota de escrita aberta.
  @IsString()
  @IsOptional()
  @MinLength(32)
  ETL_TOKEN?: string;
}

const paraInt = (v: string | undefined, padrao: number) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isNaN(n) ? padrao : n;
};

const paraBool = (v: string | undefined, padrao = false) => {
  if (v === undefined) return padrao;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

export interface Configuracao {
  ambiente: string;
  producao: boolean;
  porta: number;
  databaseUrl: string;
  versao: string;
  jwt: { acessoSegredo: string; refreshSegredo: string; acessoTtl: string; refreshTtl: string };
  cookie: { segredo: string; dominio?: string; seguro: boolean };
  minio: {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region?: string;
    urlPublica?: string;
  };
  corsOrigin: string[];
  appUrl?: string;
  etlToken?: string;
  uploadMaxBytes: number;
  oauth: {
    contaAzul: { clientId?: string; clientSecret?: string; escopo: string };
    meta: { appId?: string; appSecret?: string };
  };
}

export function carregarConfiguracao(): Configuracao {
  const bruto = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: paraInt(process.env.PORT, 3261),
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? '',
    COOKIE_SECRET: process.env.COOKIE_SECRET ?? '',
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? '',
    MINIO_PORT: paraInt(process.env.MINIO_PORT, 9000),
    MINIO_USE_SSL: paraBool(process.env.MINIO_USE_SSL, false),
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? '',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? '',
    MINIO_BUCKET: process.env.MINIO_BUCKET ?? 'febrahub',
    MINIO_REGION: process.env.MINIO_REGION,
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '',
    APP_URL: process.env.APP_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    ETL_TOKEN: process.env.ETL_TOKEN,
  };

  const validado = plainToInstance(VariaveisAmbiente, bruto, {
    enableImplicitConversion: false,
  });
  const erros = validateSync(validado, { skipMissingProperties: false });
  if (erros.length) {
    const detalhe = erros
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Configuração inválida:\n  ${detalhe}`);
  }

  const producao = bruto.NODE_ENV === 'production';

  return {
    ambiente: bruto.NODE_ENV,
    producao,
    porta: bruto.PORT,
    databaseUrl: bruto.DATABASE_URL,
    versao: process.env.APP_VERSION ?? '1.0.0',
    jwt: {
      acessoSegredo: bruto.JWT_ACCESS_SECRET,
      refreshSegredo: bruto.JWT_REFRESH_SECRET,
      acessoTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    },
    cookie: {
      segredo: bruto.COOKIE_SECRET,
      dominio: bruto.COOKIE_DOMAIN,
      seguro: producao,
    },
    minio: {
      endPoint: bruto.MINIO_ENDPOINT,
      port: bruto.MINIO_PORT,
      useSSL: bruto.MINIO_USE_SSL,
      accessKey: bruto.MINIO_ACCESS_KEY,
      secretKey: bruto.MINIO_SECRET_KEY,
      bucket: bruto.MINIO_BUCKET,
      region: bruto.MINIO_REGION,
      urlPublica: process.env.MINIO_PUBLIC_URL,
    },
    corsOrigin: bruto.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
    appUrl: bruto.APP_URL,
    etlToken: bruto.ETL_TOKEN,
    uploadMaxBytes: paraInt(process.env.UPLOAD_MAX_BYTES, 25 * 1024 * 1024),
    // Credenciais OAuth das fontes externas. NÃO entram na validação de boot:
    // a API tem que subir sem elas (nem todo ambiente conecta integração).
    // Quando faltam, a rota de integração responde INTEGRACAO_NAO_CONFIGURADA
    // dizendo qual variável falta — erro legível, não 500.
    //
    // Onde elas vivem: até aqui só o serviço `etl` lia /opt/febrahub/etl.env.
    // Agora quem autoriza é a API, então o mesmo arquivo entra no `env_file`
    // dela no docker-compose.prod.yml.
    oauth: {
      contaAzul: {
        clientId: process.env.CONTAAZUL_CLIENT_ID,
        clientSecret: process.env.CONTAAZUL_CLIENT_SECRET,
        // O Conta Azul v2 roda sobre Cognito: sem
        // `aws.cognito.signin.user.admin` o authorize devolve escopo inválido.
        // Configurável porque o provedor já mudou a lista de escopos antes.
        escopo: process.env.CONTAAZUL_SCOPE ?? 'openid profile aws.cognito.signin.user.admin',
      },
      meta: {
        appId: process.env.META_APP_ID,
        appSecret: process.env.META_APP_SECRET,
      },
    },
  };
}
