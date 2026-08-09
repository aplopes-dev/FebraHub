/**
 * Seed de metas do Hub Executivo.
 *
 * Para cada indicador com metaFonte='cadastro':
 *   1. Lê a série mensal (SQL do catálogo);
 *   2. Pega até 24 meses FECHADOS mais recentes (ideal = 2 anos);
 *   3. Calcula a média mensal desse período;
 *   4. Grava meta mensal para todos os meses do ano corrente
 *      e meta anual (= média × 12 para fluxo; = média para razão).
 *
 * Idempotente: upsert pela chave (indicador, escopo, competência).
 * Com --force sobrescreve valores já existentes; sem --force só preenche
 * quem ainda está sem meta (ou metas marcadas como este seed).
 *
 * Rodar (rede Docker):
 *   DATABASE_URL=... npx ts-node prisma/seed-metas.ts
 *   DATABASE_URL=... npx ts-node prisma/seed-metas.ts --force
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { INDICADORES } from '../src/modules/executivo/indicadores';

const prisma = new PrismaClient();
const FORCE = process.argv.includes('--force');
const MARCA = 'Seed: média histórica (até 24 meses)';

type Ponto = { mes: string; valor: number };

function mesAtualBahia(): string {
  // YYYY-MM do "hoje" em America/Bahia — evita gravar meta no mês parcial
  // como se fosse histórico fechado.
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = partes.find((p) => p.type === 'year')!.value;
  const m = partes.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

function anoCorrente(): number {
  return Number(mesAtualBahia().slice(0, 4));
}

function normalizarMes(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw);
  // Aceita YYYY-MM, YYYY-MM-01, Date ISO…
  const m = s.match(/^(\d{4}-\d{2})/);
  return m?.[1] ?? null;
}

async function serieDoIndicador(sql: string): Promise<Ponto[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ mes: unknown; valor: unknown }>>(sql);
  const pontos: Ponto[] = [];
  for (const r of rows) {
    const mes = normalizarMes(r.mes);
    if (!mes) continue;
    const valor = Number(r.valor);
    if (!Number.isFinite(valor)) continue;
    pontos.push({ mes, valor });
  }
  pontos.sort((a, b) => a.mes.localeCompare(b.mes));
  return pontos;
}

/** Até 24 meses fechados mais recentes (exclui o mês corrente). */
function janelaHistorica(serie: Ponto[], mesCorrente: string): Ponto[] {
  const fechados = serie.filter((p) => p.mes < mesCorrente);
  if (fechados.length === 0) return [];
  return fechados.slice(-24);
}

function media(pontos: Ponto[]): number {
  const soma = pontos.reduce((acc, p) => acc + p.valor, 0);
  return soma / pontos.length;
}

function arredondarMeta(valor: number, razao: boolean): number {
  if (!Number.isFinite(valor)) return 0;
  if (razao) {
    // ticket / % / NPS — 2 casas
    return Math.round(valor * 100) / 100;
  }
  // fluxo: inteiro
  return Math.round(valor);
}

async function upsertMeta(params: {
  indicador: string;
  escopo: 'mes' | 'ano';
  competencia: Date;
  valor: number;
  observacao: string;
}): Promise<'criada' | 'atualizada' | 'mantida'> {
  const existente = await prisma.metaIndicador.findUnique({
    where: {
      indicador_escopo_competencia: {
        indicador: params.indicador,
        escopo: params.escopo,
        competencia: params.competencia,
      },
    },
  });

  if (existente && !FORCE) {
    const ehSeed = (existente.observacao ?? '').startsWith('Seed:');
    if (!ehSeed) return 'mantida';
  }

  await prisma.metaIndicador.upsert({
    where: {
      indicador_escopo_competencia: {
        indicador: params.indicador,
        escopo: params.escopo,
        competencia: params.competencia,
      },
    },
    create: {
      indicador: params.indicador,
      escopo: params.escopo,
      competencia: params.competencia,
      valor: new Prisma.Decimal(params.valor),
      observacao: params.observacao,
    },
    update: {
      valor: new Prisma.Decimal(params.valor),
      observacao: params.observacao,
      atualizadoEm: new Date(),
    },
  });
  return existente ? 'atualizada' : 'criada';
}

async function main() {
  const mesCorrente = mesAtualBahia();
  const ano = anoCorrente();
  console.log(`Seed de metas · ano ${ano} · mês corrente ${mesCorrente} · force=${FORCE}`);

  const candidatos = INDICADORES.filter(
    (d) => d.metaFonte === 'cadastro' && !!d.sql.serieMensal,
  );

  let criadas = 0;
  let atualizadas = 0;
  let mantidas = 0;
  let pulados = 0;

  for (const def of candidatos) {
    let serie: Ponto[];
    try {
      serie = await serieDoIndicador(def.sql.serieMensal!);
    } catch (err) {
      console.warn(`  ! ${def.codigo}: falha na série — ${(err as Error).message}`);
      pulados += 1;
      continue;
    }

    const janela = janelaHistorica(serie, mesCorrente);
    if (janela.length === 0) {
      console.warn(`  · ${def.codigo}: sem meses fechados — pulado`);
      pulados += 1;
      continue;
    }

    const mediaMensal = arredondarMeta(media(janela), !!def.razao);
    if (mediaMensal === 0) {
      console.warn(`  · ${def.codigo}: média zero no período — pulado`);
      pulados += 1;
      continue;
    }
    const metaAnual = arredondarMeta(
      def.razao ? mediaMensal : mediaMensal * 12,
      !!def.razao,
    );
    const de = janela[0].mes;
    const ate = janela[janela.length - 1].mes;
    const obs = `${MARCA} · ${janela.length}m (${de}→${ate}) · média ${mediaMensal}`;

    console.log(
      `  → ${def.codigo}: média ${mediaMensal} / ano ${metaAnual} · base ${janela.length}m (${de}→${ate})`,
    );

    for (let m = 1; m <= 12; m++) {
      const comp = new Date(Date.UTC(ano, m - 1, 1));
      const r = await upsertMeta({
        indicador: def.codigo,
        escopo: 'mes',
        competencia: comp,
        valor: mediaMensal,
        observacao: obs,
      });
      if (r === 'criada') criadas += 1;
      else if (r === 'atualizada') atualizadas += 1;
      else mantidas += 1;
    }

    const rAno = await upsertMeta({
      indicador: def.codigo,
      escopo: 'ano',
      competencia: new Date(Date.UTC(ano, 0, 1)),
      valor: metaAnual,
      observacao: obs,
    });
    if (rAno === 'criada') criadas += 1;
    else if (rAno === 'atualizada') atualizadas += 1;
    else mantidas += 1;
  }

  console.log(
    `\nPronto: ${criadas} criadas · ${atualizadas} atualizadas · ${mantidas} mantidas · ${pulados} indicadores sem dado`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
