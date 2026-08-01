import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { podeVer } from '../../common/guards/setor.guard';
import { CATALOGO, VIEWS_ABERTAS, catalogada } from './catalogo';

/** Teto de segurança: nenhuma view do sistema chega perto disso hoje. */
const LIMITE_LINHAS = 200_000;

@Injectable()
export class DadosService {
  private readonly logger = new Logger(DadosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lê uma relação do catálogo inteira.
   *
   * Sem paginação de propósito. O front antigo tinha de paginar de mil em mil
   * porque o PostgREST cortava a resposta no "Max rows" do projeto — em
   * silêncio, sem erro, fazendo categorias inteiras sumirem do mês. Aqui a
   * consulta é nossa e devolve tudo; o teto existe só como rede de segurança.
   */
  async ler(nome: string, usuario: UsuarioLogado): Promise<Record<string, unknown>[]> {
    if (!catalogada(nome)) {
      // 404 e não 403: quem não está no catálogo não existe para a API, e
      // responder "sem permissão" confirmaria que a relação existe.
      throw new NotFoundException({ codigo: 'VIEW_DESCONHECIDA', message: 'Recurso não encontrado' });
    }

    if (!VIEWS_ABERTAS.has(nome)) {
      const { setor } = CATALOGO[nome];
      if (!podeVer(usuario, [setor])) {
        throw new ForbiddenException({
          codigo: 'SETOR_NEGADO',
          message: 'Seu perfil não tem acesso a este setor',
        });
      }
    }

    const ordem = CATALOGO[nome]?.ordem ?? [];
    // `nome` e as colunas de ordenação vêm do catálogo, nunca do cliente —
    // por isso podem entrar como identificador na consulta.
    const orderBy = ordem.length
      ? ` ORDER BY ${ordem.map((c) => `"${c}" ASC NULLS LAST`).join(', ')}`
      : '';
    const sql = `SELECT * FROM public."${nome}"${orderBy} LIMIT ${LIMITE_LINHAS}`;

    const inicio = Date.now();
    const linhas = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql);
    const ms = Date.now() - inicio;
    if (ms > 2000) this.logger.warn(`${nome}: ${linhas.length} linhas em ${ms}ms`);

    return linhas.map(normalizar);
  }

  /** Quais views ainda são espelho do snapshot (não recomputam com os ETLs). */
  async viewsCongeladas(): Promise<string[]> {
    const linhas = await this.prisma.$queryRaw<{ viewname: string }[]>`
      SELECT viewname FROM pg_views
       WHERE schemaname = 'public'
         AND definition ILIKE '%snapshot.%'
       ORDER BY viewname
    `;
    return linhas.map((l) => l.viewname);
  }
}

/**
 * Decimal e BigInt do Postgres não sobrevivem a JSON.stringify: Decimal vira
 * objeto e BigInt lança TypeError. O front espera número, como recebia do
 * PostgREST — então a conversão acontece aqui, uma vez.
 */
function normalizar(linha: Record<string, unknown>): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(linha)) {
    if (typeof v === 'bigint') {
      saida[k] = Number(v);
    } else if (v && typeof v === 'object' && 'toNumber' in v && typeof v.toNumber === 'function') {
      saida[k] = (v as { toNumber: () => number }).toNumber();
    } else if (v instanceof Date) {
      // Coluna `date` vira 'YYYY-MM-DD'; o front compara datas como string ISO
      // e um horário no meio quebraria a comparação de recorte.
      saida[k] = v.toISOString().slice(0, 10) === v.toISOString().slice(0, 10) &&
        v.getUTCHours() === 0 && v.getUTCMinutes() === 0 && v.getUTCSeconds() === 0
        ? v.toISOString().slice(0, 10)
        : v.toISOString();
    } else {
      saida[k] = v;
    }
  }
  return saida;
}
