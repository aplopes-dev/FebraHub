import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StoneConciliacaoClient } from './stone-conciliacao.client';
import { parseConciliacaoXml } from './stone-conciliacao.parser';

const D = (n: number) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

/** AAAAMMDD a partir de um Date (em horário local do servidor = Brasília). */
function fmtDia(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

/** AAAAMMDD → Date (meia-noite UTC — coluna é @db.Date). */
function diaParaDate(aaaammdd: string): Date {
  return new Date(`${aaaammdd.slice(0, 4)}-${aaaammdd.slice(4, 6)}-${aaaammdd.slice(6, 8)}T00:00:00Z`);
}

@Injectable()
export class StoneConciliacaoService {
  private readonly logger = new Logger(StoneConciliacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: StoneConciliacaoClient,
  ) {}

  get configurado(): boolean {
    return this.client.configurado;
  }

  /**
   * Importa o arquivo de conciliação de um dia (AAAAMMDD). Idempotente: faz
   * upsert por `acquirerTransactionKey`, então rodar de novo não duplica.
   * Registra o resultado em StoneConciliacaoImport.
   */
  async importarDia(aaaammdd: string, stoneCode?: string): Promise<{ referenceDate: string; status: string; quantidade: number; erro?: string }> {
    const code = stoneCode || this.client.stoneCode;
    const referenceDate = diaParaDate(aaaammdd);

    try {
      const xml = await this.client.baixarArquivo(aaaammdd, code);
      if (!xml) {
        await this.registrarImport(code, referenceDate, 'vazio', 0);
        return { referenceDate: aaaammdd, status: 'vazio', quantidade: 0 };
      }

      const parsed = parseConciliacaoXml(xml);
      const codeArquivo = parsed.stoneCode || code;
      let n = 0;

      for (const t of parsed.transacoes) {
        await this.prisma.stoneConciliacaoTransacao.upsert({
          where: { acquirerTransactionKey: t.acquirerTransactionKey },
          create: {
            stoneCode: codeArquivo,
            referenceDate,
            acquirerTransactionKey: t.acquirerTransactionKey,
            initiatorTransactionKey: t.initiatorTransactionKey,
            authorizationDateTime: t.authorizationDateTime,
            captureDateTime: t.captureDateTime,
            accountType: t.accountType,
            brandId: t.brandId,
            brandNome: t.brandNome,
            cardNumber: t.cardNumber,
            numberOfInstallments: t.numberOfInstallments,
            authorizationCode: t.authorizationCode,
            poiSerialNumber: t.poiSerialNumber,
            grossAmount: D(t.grossAmount),
            netAmount: D(t.netAmount),
            feeAmount: D(t.feeAmount),
            previsionPaymentDate: t.previsionPaymentDate,
            cancelado: t.cancelado,
            bruto: t.bruto as Prisma.InputJsonValue,
          },
          update: {
            // Só campos que podem mudar entre extrações (cancelamento, líquido).
            netAmount: D(t.netAmount),
            feeAmount: D(t.feeAmount),
            previsionPaymentDate: t.previsionPaymentDate,
            cancelado: t.cancelado,
          },
        });
        n++;
      }

      await this.registrarImport(codeArquivo, referenceDate, n > 0 ? 'ok' : 'vazio', n);
      this.logger.log(`Conciliação Stone ${aaaammdd}: ${n} transações importadas.`);
      return { referenceDate: aaaammdd, status: n > 0 ? 'ok' : 'vazio', quantidade: n };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.registrarImport(code, referenceDate, 'erro', 0, msg).catch(() => undefined);
      this.logger.error(`Conciliação Stone ${aaaammdd} falhou: ${msg}`);
      return { referenceDate: aaaammdd, status: 'erro', quantidade: 0, erro: msg };
    }
  }

  /** Importa o dia de ONTEM (chamado pelo cron; arquivo só existe após 5h). */
  async importarOntem(): Promise<{ referenceDate: string; status: string; quantidade: number }> {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return this.importarDia(fmtDia(ontem));
  }

  /**
   * Backfill: importa TODOS os dias de um intervalo (AAAAMMDD..AAAAMMDD),
   * pulando dias já importados com sucesso (a menos de `forcar`). Sequencial
   * para não estourar o gateway. Limite de 400 dias por chamada.
   */
  async importarPeriodo(deAAAAMMDD: string, ateAAAAMMDD: string, forcar = false): Promise<{ de: string; ate: string; dias: number; transacoes: number; jaImportados: number; erros: number }> {
    const de = diaParaDate(deAAAAMMDD);
    const ate = diaParaDate(ateAAAAMMDD);
    if (ate < de) return { de: deAAAAMMDD, ate: ateAAAAMMDD, dias: 0, transacoes: 0, jaImportados: 0, erros: 0 };

    // dias já importados com sucesso (ok|vazio) para pular no modo incremental
    const jaFeitos = new Set<string>();
    if (!forcar) {
      const feitos = await this.prisma.stoneConciliacaoImport.findMany({
        where: { referenceDate: { gte: de, lte: ate }, status: { in: ['ok', 'vazio'] } },
        select: { referenceDate: true },
      });
      for (const f of feitos) jaFeitos.add(fmtDia(new Date(f.referenceDate)));
    }

    let dias = 0, transacoes = 0, jaImportados = 0, erros = 0;
    const cursor = new Date(de);
    const limite = 400;
    while (cursor <= ate && dias < limite) {
      const dia = fmtDia(cursor);
      if (jaFeitos.has(dia)) {
        jaImportados++;
      } else {
        const r = await this.importarDia(dia);
        if (r.status === 'erro') erros++;
        else transacoes += r.quantidade;
      }
      dias++;
      cursor.setDate(cursor.getDate() + 1);
    }
    this.logger.log(`Backfill Stone ${deAAAAMMDD}..${ateAAAAMMDD}: ${dias} dias, ${transacoes} transações, ${jaImportados} já importados, ${erros} erros.`);
    return { de: deAAAAMMDD, ate: ateAAAAMMDD, dias, transacoes, jaImportados, erros };
  }

  private async registrarImport(stoneCode: string, referenceDate: Date, status: string, quantidade: number, erro?: string) {
    await this.prisma.stoneConciliacaoImport.upsert({
      where: { stoneCode_referenceDate: { stoneCode, referenceDate } },
      create: { stoneCode, referenceDate, status, quantidade, erro },
      update: { status, quantidade, erro: erro ?? null },
    });
  }

  // -------------------- CONSULTAS (financeiro) --------------------

  /** Lista transações conciliadas por período (datas AAAAMMDD) + filtros. */
  async listar(filtros: { de?: string; ate?: string; serial?: string; bandeira?: string }) {
    const where: Prisma.StoneConciliacaoTransacaoWhereInput = {};
    if (filtros.de || filtros.ate) {
      where.referenceDate = {};
      if (filtros.de) (where.referenceDate as Prisma.DateTimeFilter).gte = diaParaDate(filtros.de);
      if (filtros.ate) (where.referenceDate as Prisma.DateTimeFilter).lte = diaParaDate(filtros.ate);
    }
    if (filtros.serial) where.poiSerialNumber = filtros.serial;
    if (filtros.bandeira) where.brandNome = filtros.bandeira;

    const [itens, resumo] = await Promise.all([
      this.prisma.stoneConciliacaoTransacao.findMany({ where, orderBy: { captureDateTime: 'desc' }, take: 500 }),
      this.prisma.stoneConciliacaoTransacao.aggregate({ where, _count: true, _sum: { grossAmount: true, netAmount: true, feeAmount: true } }),
    ]);
    return jsonSeguro({
      total: resumo._count,
      somaBruto: resumo._sum.grossAmount ?? 0,
      somaLiquido: resumo._sum.netAmount ?? 0,
      somaTaxas: resumo._sum.feeAmount ?? 0,
      itens,
    });
  }

  /** Histórico de importações (para a UI mostrar quando foi conciliado). */
  async imports() {
    return jsonSeguro(await this.prisma.stoneConciliacaoImport.findMany({ orderBy: { referenceDate: 'desc' }, take: 90 }));
  }

  /** Status da integração (para a UI decidir o que exibir). */
  status() {
    return { configurado: this.client.configurado, stoneCode: this.client.stoneCode || null };
  }
}
