import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import {
  AvaliacaoDto,
  AvaliacaoEventoDto,
  AvaliacaoListaQuery,
  MaestroAnotacaoDto,
  RetencaoDto,
} from './dto/pedagogico.dto';

function num(v: Prisma.Decimal | null | undefined): number | null {
  return v == null ? null : Number(v);
}

@Injectable()
export class PedagogicoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarAvaliacoes(q: AvaliacaoListaQuery) {
    const pagina = q.pagina ?? 1;
    const por_pagina = q.por_pagina ?? 50;
    const where: Prisma.FatoAvaliacaoWhereInput = {};
    if (q.fonte) where.fonte = q.fonte;
    if (q.curso) where.curso = { contains: q.curso, mode: 'insensitive' };
    const [total, rows] = await Promise.all([
      this.prisma.fatoAvaliacao.count({ where }),
      this.prisma.fatoAvaliacao.findMany({
        where,
        skip: (pagina - 1) * por_pagina,
        take: por_pagina,
        orderBy: [{ dataCurso: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return {
      pagina,
      por_pagina,
      total,
      itens: rows.map((r) => ({
        id: Number(r.id),
        fonte: r.fonte,
        curso: r.curso,
        treinador: r.treinador,
        data_curso: r.dataCurso?.toISOString().slice(0, 10) ?? null,
        turma: r.turma,
        respondentes: r.respondentes,
        q_conteudo: num(r.qConteudo),
        q_clareza: num(r.qClareza),
        q_material: num(r.qMaterial),
        q_aplicacao: num(r.qAplicacao),
        q_dominio: num(r.qDominio),
        q_pontualidade: num(r.qPontualidade),
        q_duvidas: num(r.qDuvidas),
        nps: num(r.nps),
        nota_treinador: num(r.notaTreinador),
        comentario: r.comentario,
        criado_em: r.criadoEm?.toISOString() ?? null,
      })),
    };
  }

  async salvarAvaliacao(dto: AvaliacaoDto, u: UsuarioLogado) {
    const criado = await this.prisma.fatoAvaliacao.create({
      data: this.dadosAvaliacao(dto),
    });
    await this.auditar(u.id, 'avaliacao_criada', `fato_avaliacao:${criado.id}`);
    return { id: Number(criado.id) };
  }

  async atualizarAvaliacao(id: number, dto: AvaliacaoDto, u: UsuarioLogado) {
    const antes = await this.prisma.fatoAvaliacao.findUnique({ where: { id: BigInt(id) } });
    if (!antes) {
      throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Avaliação não encontrada' });
    }
    await this.prisma.fatoAvaliacao.update({
      where: { id: BigInt(id) },
      data: this.dadosAvaliacao(dto),
    });
    await this.auditar(u.id, 'avaliacao_atualizada', `fato_avaliacao:${id}`);
    return { id };
  }

  async apagarAvaliacao(id: number, u: UsuarioLogado) {
    const antes = await this.prisma.fatoAvaliacao.findUnique({ where: { id: BigInt(id) } });
    if (!antes) {
      throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Avaliação não encontrada' });
    }
    await this.prisma.fatoAvaliacao.delete({ where: { id: BigInt(id) } });
    await this.auditar(u.id, 'avaliacao_apagada', `fato_avaliacao:${id}`);
    return { ok: true };
  }

  async listarAvaliacoesEvento(q: AvaliacaoListaQuery) {
    const pagina = q.pagina ?? 1;
    const por_pagina = q.por_pagina ?? 50;
    const where: Prisma.FatoAvaliacaoEventoWhereInput = {};
    if (q.curso) where.evento = { contains: q.curso, mode: 'insensitive' };
    const [total, rows] = await Promise.all([
      this.prisma.fatoAvaliacaoEvento.count({ where }),
      this.prisma.fatoAvaliacaoEvento.findMany({
        where,
        skip: (pagina - 1) * por_pagina,
        take: por_pagina,
        orderBy: [{ dataEvento: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return {
      pagina,
      por_pagina,
      total,
      itens: rows.map((r) => ({
        id: Number(r.id),
        evento: r.evento,
        data_evento: r.dataEvento?.toISOString().slice(0, 10) ?? null,
        nota_indicacao: r.notaIndicacao,
        comentario: r.comentario,
        respostas: r.respostas,
        resposta_id: r.respostaId,
        criado_em: r.criadoEm?.toISOString() ?? null,
      })),
    };
  }

  async salvarAvaliacaoEvento(dto: AvaliacaoEventoDto, u: UsuarioLogado) {
    const criado = await this.prisma.fatoAvaliacaoEvento.create({
      data: {
        evento: dto.evento,
        dataEvento: dto.data_evento ? new Date(`${dto.data_evento}T00:00:00Z`) : null,
        notaIndicacao: dto.nota_indicacao ?? null,
        comentario: dto.comentario ?? null,
        respostas: dto.respostas ?? null,
        respostaId: dto.resposta_id ?? null,
        criadoEm: new Date(),
      },
    });
    await this.auditar(u.id, 'avaliacao_evento_criada', `fato_avaliacao_evento:${criado.id}`);
    return { id: Number(criado.id) };
  }

  async atualizarAvaliacaoEvento(id: number, dto: AvaliacaoEventoDto, u: UsuarioLogado) {
    const antes = await this.prisma.fatoAvaliacaoEvento.findUnique({ where: { id: BigInt(id) } });
    if (!antes) {
      throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Avaliação não encontrada' });
    }
    await this.prisma.fatoAvaliacaoEvento.update({
      where: { id: BigInt(id) },
      data: {
        evento: dto.evento,
        dataEvento: dto.data_evento ? new Date(`${dto.data_evento}T00:00:00Z`) : null,
        notaIndicacao: dto.nota_indicacao ?? null,
        comentario: dto.comentario ?? null,
        respostas: dto.respostas ?? null,
        respostaId: dto.resposta_id ?? null,
      },
    });
    await this.auditar(u.id, 'avaliacao_evento_atualizada', `fato_avaliacao_evento:${id}`);
    return { id };
  }

  async apagarAvaliacaoEvento(id: number, u: UsuarioLogado) {
    const antes = await this.prisma.fatoAvaliacaoEvento.findUnique({ where: { id: BigInt(id) } });
    if (!antes) {
      throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Avaliação não encontrada' });
    }
    await this.prisma.fatoAvaliacaoEvento.delete({ where: { id: BigInt(id) } });
    await this.auditar(u.id, 'avaliacao_evento_apagada', `fato_avaliacao_evento:${id}`);
    return { ok: true };
  }

  async salvarMaestroAnotacao(dto: MaestroAnotacaoDto, u: UsuarioLogado) {
    const dados = {
      comoGostaSerChamado: dto.como_gosta_ser_chamado ?? null,
      cargo: dto.cargo ?? null,
      empresa: dto.empresa ?? null,
      faturamento: dto.faturamento ?? null,
      observacoes: dto.observacoes ?? null,
      atualizadoEm: new Date(),
    };
    await this.prisma.maestroAnotacao.upsert({
      where: { alunoId: dto.aluno_id },
      create: { alunoId: dto.aluno_id, ...dados },
      update: dados,
    });
    await this.auditar(u.id, 'maestro_anotado', `maestro_anotacao:${dto.aluno_id}`);
    return { aluno_id: dto.aluno_id };
  }

  async salvarRetencao(dto: RetencaoDto, u: UsuarioLogado) {
    const dados = {
      nomeCliente: dto.nome_cliente,
      curso: dto.curso,
      motivoCancelamento: dto.motivo_cancelamento ?? null,
      dataLigacao: dto.data_ligacao ? new Date(dto.data_ligacao) : null,
      desfecho: dto.desfecho ?? 'pendente',
      observacoes: dto.observacoes ?? null,
    };

    if (dto.id != null) {
      const r = await this.prisma.fatoRetencao.update({
        where: { id: BigInt(dto.id) },
        data: dados,
      });
      await this.auditar(u.id, 'retencao_atualizada', `fato_retencao:${r.id}`);
      return { id: Number(r.id) };
    }

    const r = await this.prisma.fatoRetencao.create({
      data: { ...dados, registradoPor: u.email },
    });
    await this.auditar(u.id, 'retencao_criada', `fato_retencao:${r.id}`);
    return { id: Number(r.id) };
  }

  private dadosAvaliacao(dto: AvaliacaoDto) {
    return {
      fonte: dto.fonte,
      curso: dto.curso,
      treinador: dto.treinador,
      dataCurso: new Date(dto.data_curso),
      turma: dto.turma ?? null,
      respondentes: dto.respondentes,
      qConteudo: dto.q_conteudo ?? null,
      qClareza: dto.q_clareza ?? null,
      qMaterial: dto.q_material ?? null,
      qAplicacao: dto.q_aplicacao ?? null,
      qDominio: dto.q_dominio ?? null,
      qPontualidade: dto.q_pontualidade ?? null,
      qDuvidas: dto.q_duvidas ?? null,
      nps: dto.nps ?? null,
      notaTreinador: dto.nota_treinador ?? null,
      comentario: dto.comentario ?? null,
    };
  }

  private async auditar(usuarioId: string, acao: string, recurso: string) {
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId, acao, recurso } })
      .catch(() => undefined);
  }
}
