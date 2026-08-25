import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardQuery } from '../dto/operacional.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(q: DashboardQuery) {
    const hoje = new Date();
    const em30dias = new Date(hoje.getTime() + 30 * 24 * 3600 * 1000);

    // Filtro base de turmas
    const whereTurma: any = {};
    if (q.unidade)    whereTurma.unidade   = { contains: q.unidade, mode: 'insensitive' };
    if (q.cursoId)    whereTurma.cursoId   = q.cursoId;
    if (q.turmaId)    whereTurma.id        = q.turmaId;
    if (q.periodoInicio) whereTurma.dataInicio = { ...whereTurma.dataInicio, gte: new Date(q.periodoInicio) };
    if (q.periodoFim)    whereTurma.dataFim    = { ...whereTurma.dataFim,    lte: new Date(q.periodoFim) };

    // Turmas próximas (até 30 dias, status confirmada/planejada/em_preparação)
    const [turmasProximas, totalTurmas, statusMatriculas, represadosVencendo, solicitacoesAbertas] =
      await Promise.all([
        this.prisma.pedagogicoTurma.findMany({
          where: {
            ...whereTurma,
            dataInicio: { gte: hoje, lte: em30dias },
            status: { in: ['Planejada', 'Confirmada', 'Em Preparação'] },
          },
          include: {
            _count: { select: { matriculas: true, credenciamentos: true } },
          },
          orderBy: { dataInicio: 'asc' },
          take: 10,
        }),
        this.prisma.pedagogicoTurma.count({ where: whereTurma }),
        this.prisma.pedagogicoMatricula.groupBy({
          by: ['status'],
          where: {
            turma: whereTurma,
          },
          _count: { id: true },
        }),
        // Represados com validade nos próximos 60 dias
        this.prisma.pedagogicoMatricula.count({
          where: {
            status: 'Represado',
            validadeFim: { lte: new Date(hoje.getTime() + 60 * 24 * 3600 * 1000) },
            turma: whereTurma,
          },
        }),
        this.prisma.pedagogicoSolicitacao.count({
          where: { status: { in: ['aberta', 'em_analise'] } },
        }),
      ]);

    const contagem = Object.fromEntries(statusMatriculas.map(s => [s.status, s._count.id]));
    const total       = Object.values(contagem).reduce((a, b) => a + b, 0);
    const confirmados = contagem['Confirmado'] ?? 0;
    const matriculados = total;
    const presentes   = (contagem['Em Curso'] ?? 0) + (contagem['Concluído'] ?? 0);
    const faltantes   = contagem['Faltou'] ?? 0;
    const represados  = contagem['Represado'] ?? 0;
    const transferidos = contagem['Transferido'] ?? 0;

    return {
      turmasProximas: turmasProximas.map(t => ({
        id:        t.id,
        nome:      t.nome,
        cursoNome: t.cursoNome,
        unidade:   t.unidade,
        dataInicio: t.dataInicio?.toISOString().slice(0, 10) ?? null,
        dataFim:    t.dataFim?.toISOString().slice(0, 10) ?? null,
        capacidade: t.capacidade,
        status:     t.status,
        matriculados: t._count.matriculas,
        credenciados: t._count.credenciamentos,
      })),
      cards: {
        totalTurmas,
        matriculados,
        confirmados,
        aguardandoContato:  contagem['Aguardando Contato'] ?? 0,
        aguardandoResposta: contagem['Aguardando Resposta'] ?? 0,
        naoResponderam:     contagem['Não Respondeu'] ?? 0,
        presentes,
        faltantes,
        represados,
        transferidos,
        cancelados:          contagem['Cancelado'] ?? 0,
        represadosVencendo,
        solicitacoesAbertas,
      },
      taxas: {
        confirmacao:           matriculados > 0 ? ((confirmados / matriculados) * 100).toFixed(1) : null,
        comparecimentoSobreConfirmados: confirmados > 0 ? ((presentes / confirmados) * 100).toFixed(1) : null,
        comparecimentoSobreVendidos:    matriculados > 0 ? ((presentes / matriculados) * 100).toFixed(1) : null,
      },
      exigeAtencao: {
        naoResponderam:     contagem['Não Respondeu'] ?? 0,
        aguardandoContato:  contagem['Aguardando Contato'] ?? 0,
        represadosVencendo,
        solicitacoesAbertas,
      },
    };
  }

  async represados(q: DashboardQuery) {
    const hoje = new Date();
    const where: any = {
      status: 'Represado',
    };
    if (q.unidade)  where.unidade  = { contains: q.unidade, mode: 'insensitive' };
    if (q.cursoId)  where.cursoId  = q.cursoId;

    const represados = await this.prisma.pedagogicoMatricula.findMany({
      where,
      orderBy: { validadeFim: 'asc' },
      include: {
        turma: { select: { id: true, nome: true, cursoNome: true, dataInicio: true } },
        confirmacoes: {
          orderBy: { criadoEm: 'desc' },
          take: 1,
        },
        transferencias: { orderBy: { criadoEm: 'desc' }, take: 1 },
      },
    });

    return represados.map(r => {
      const diasRestantes = r.validadeFim
        ? Math.ceil((r.validadeFim.getTime() - hoje.getTime()) / (1000 * 3600 * 24))
        : null;
      return {
        id:             r.id,
        pessoaNome:     r.pessoaNome,
        pessoaCpf:      r.pessoaCpf,
        pessoaTelefone: r.pessoaTelefone,
        pessoaEmail:    r.pessoaEmail,
        cursoNome:      r.cursoNome,
        dataCompra:     r.dataCompra?.toISOString().slice(0, 10) ?? null,
        validadeFim:    r.validadeFim?.toISOString().slice(0, 10) ?? null,
        diasRestantes,
        alertaVencimento: diasRestantes !== null && diasRestantes <= 30,
        turmaNome:      r.turma?.nome ?? null,
        turmaInicio:    r.turma?.dataInicio?.toISOString().slice(0, 10) ?? null,
        ultimaConfirmacao: r.confirmacoes?.[0] ?? null,
        transferencias:  r.transferencias?.length ?? 0,
        unidade:        r.unidade,
      };
    });
  }
}
