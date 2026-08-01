import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { carregarConfiguracao } from './config/configuracao';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DadosModule } from './modules/dados/dados.module';
import { ArquivosModule } from './modules/arquivos/arquivos.module';
import { PedagogicoModule } from './modules/pedagogico/pedagogico.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { IntegracoesModule } from './modules/integracoes/integracoes.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthController } from './modules/health/health.controller';
import { SessaoGuard } from './common/guards/sessao.guard';
import { SetorGuard } from './common/guards/setor.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [() => ({ app: carregarConfiguracao() })],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        // Log estruturado sem segredo: cookie, authorization e o token dos
        // ETLs saem do registro. Log é o lugar mais fácil de vazar sessão.
        redact: {
          paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'req.headers["x-etl-token"]',
            'res.headers["set-cookie"]',
            'req.body.senha',
            'req.body.atual',
            'req.body.nova',
          ],
          remove: true,
        },
        autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    // Agenda em processo. Hoje só a renovação diária dos tokens OAuth
    // (modules/integracoes/renovacao.cron.ts) — o resto do agendamento
    // continua no cron do host, que chama os ETLs.
    ScheduleModule.forRoot(),
    DatabaseModule,
    StorageModule,
    AuthModule,
    DadosModule,
    ArquivosModule,
    PedagogicoModule,
    IngestModule,
    IntegracoesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ordem importa: throttle primeiro (barra antes de gastar CPU),
    // depois sessão, depois setor.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessaoGuard },
    { provide: APP_GUARD, useClass: SetorGuard },
  ],
})
export class AppModule {}
