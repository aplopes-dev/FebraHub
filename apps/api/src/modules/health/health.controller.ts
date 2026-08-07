import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DadosService } from '../dados/dados.service';
import { Publica } from '../../common/decorators/usuario.decorator';
import { Configuracao } from '../../config/configuracao';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly cfg: Configuracao;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly dados: DadosService,
    config: ConfigService,
  ) {
    this.cfg = config.get<Configuracao>('app')!;
  }

  /** Liveness: o processo respondeu. Usado pelo healthcheck do container. */
  @Publica()
  @Get('live')
  @ApiOperation({ summary: 'O processo está de pé' })
  live() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  /**
   * Readiness: banco e storage respondem de verdade.
   *
   * Não devolve host, usuário nem string de conexão — um health check que
   * imprime o DATABASE_URL vira reconhecimento gratuito para quem varre a
   * internet. Só o que dá para agir: quem está de pé e o que está lento.
   */
  @Publica()
  @Get()
  @ApiOperation({ summary: 'Estado geral: banco, storage e versão' })
  async geral() {
    const [banco, storage] = await Promise.all([
      medir(() => this.prisma.ping()),
      medir(() => this.storage.ping()),
    ]);

    const congeladas = banco.ok ? await this.dados.viewsCongeladas().catch(() => []) : [];

    const ok = banco.ok && storage.ok;
    return {
      status: ok ? 'ok' : 'degradado',
      versao: this.cfg.versao,
      ambiente: this.cfg.ambiente,
      timestamp: new Date().toISOString(),
      servicos: {
        postgres: { ok: banco.ok, ms: banco.ms, ...(banco.erro ? { erro: banco.erro } : {}) },
        minio: { ok: storage.ok, ms: storage.ms, ...(storage.erro ? { erro: storage.erro } : {}) },
      },
      // Views ainda espelhando o snapshot do Supabase: elas mostram o dado
      // real de quando a migração aconteceu, mas não acompanham os ETLs.
      // Fica visível aqui para ninguém tomar snapshot por pipeline vivo.
      views_congeladas: congeladas.length,
      ...(congeladas.length ? { views_congeladas_lista: congeladas } : {}),
    };
  }
}

async function medir(fn: () => Promise<unknown>) {
  const t0 = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    // Só a classe do erro: mensagem crua de driver costuma trazer host e usuário.
    return { ok: false, ms: Date.now() - t0, erro: (e as Error).name || 'falha' };
  }
}
