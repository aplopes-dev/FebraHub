import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { carregarConfiguracao } from './config/configuracao';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DadosModule } from './modules/dados/dados.module';
import { ArquivosModule } from './modules/arquivos/arquivos.module';
import { PedagogicoModule } from './modules/pedagogico/pedagogico.module';
import { CrmModule } from './modules/crm/crm.module';
import { ExecutivoModule } from './modules/executivo/executivo.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { IntegracoesModule } from './modules/integracoes/integracoes.module';
import { StorageModule } from './modules/storage/storage.module';
import { TerritorialModule } from './modules/territorial/territorial.module';
import { HealthController } from './modules/health/health.controller';
import { LimiteGuard } from './common/guards/limite.guard';
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
    // 300/min por IP era pouco: cada hub carrega de 9 a 16 views de uma vez,
    // e no escritório todo mundo sai pelo mesmo IP. Duas pessoas trocando de
    // aba juntas estouravam a cota e o painel voltava 429 pela metade.
    // Agora a contagem é por sessão (ver LimiteGuard) e a cota cabe num uso
    // real: ~40 telas por minuto para uma pessoa, o que ninguém alcança
    // navegando — mas segura um script.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 600 }]),
    // Agenda em processo. Hoje só a renovação diária dos tokens OAuth
    // (modules/integracoes/renovacao.cron.ts) — o resto do agendamento
    // continua no cron do host, que chama os ETLs.
    ScheduleModule.forRoot(),
    DatabaseModule,
    StorageModule,
    AuthModule,
    DadosModule,
    ExecutivoModule,
    ArquivosModule,
    PedagogicoModule,
    IngestModule,
    IntegracoesModule,
    TerritorialModule,
    CrmModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ordem importa: throttle primeiro (barra antes de gastar CPU),
    // depois sessão, depois setor.
    { provide: APP_GUARD, useClass: LimiteGuard },
    { provide: APP_GUARD, useClass: SessaoGuard },
    { provide: APP_GUARD, useClass: SetorGuard },
  ],
})
export class AppModule {}
