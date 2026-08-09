import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import {
  FaturamentoCursoDto,
  FechamentoDto,
  MetaCursoDto,
  MetaMesDto,
  PaginacaoQuery,
  ReceitaExtraDto,
} from './dto/loja-cadastros.dto';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function mesDate(mes: string): Date {
  return new Date(`${mes}T00:00:00Z`);
}

function dec(v: number | null | undefined): Prisma.Decimal | null {
  if (v == null || Number.isNaN(v)) return null;
  return new Prisma.Decimal(v);
}

function num(v: Prisma.Decimal | null | undefined): number | null {
  return v == null ? null : Number(v);
}

function isoMes(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class LojaCadastrosService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------- Metas mensais ---------- */

  async listarMetasMes(q: PaginacaoQuery) {
    const { skip, take, pagina, por_pagina } = this.pag(q);
    const where = q.mes ? { mesRef: mesDate(q.mes) } : {};
    const [total, rows] = await Promise.all([
      this.prisma.fatoLojaMetaMes.count({ where }),
      this.prisma.fatoLojaMetaMes.findMany({
        where, skip, take, orderBy: { mesRef: 'desc' },
      }),
    ]);
    return {
      pagina, por_pagina, total,
      itens: rows.map((r) => ({
        mes_ref: isoMes(r.mesRef),
        ano: r.ano,
        mes_nome: r.mesNome,
        minima: num(r.minima),
        basica: num(r.basica),
        master: num(r.master),
        origem: r.origemDado,
        atualizado_em: r.atualizadoEm?.toISOString() ?? null,
      })),
    };
  }

  async upsertMetaMes(dto: MetaMesDto, u: UsuarioLogado) {
    const mesRef = mesDate(dto.mes_ref);
    const ano = Number(dto.mes_ref.slice(0, 4));
    const mesNome = MESES[Number(dto.mes_ref.slice(5, 7))] || null;
    const data = {
      ano,
      mesNome,
      minima: dec(dto.minima),
      basica: dec(dto.basica),
      master: dec(dto.master),
      atualizadoEm: new Date(),
      origemDado: 'cadastro',
    };
    const antes = await this.prisma.fatoLojaMetaMes.findUnique({ where: { mesRef } });
    const row = await this.prisma.fatoLojaMetaMes.upsert({
      where: { mesRef },
      create: { mesRef, ...data },
      update: data,
    });
    await this.auditar(
      u.id,
      antes ? 'loja_meta_mes_atualizada' : 'loja_meta_mes_criada',
      `fato_loja_meta_mes:${dto.mes_ref}`,
      { tinha: !!antes, minima: dto.minima, basica: dto.basica, master: dto.master },
    );
    return { mes_ref: dto.mes_ref, origem: row.origemDado };
  }

  async apagarMetaMes(mes: string, u: UsuarioLogado) {
    const mesRef = mesDate(mes);
    const antes = await this.prisma.fatoLojaMetaMes.findUnique({ where: { mesRef } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Meta não encontrada' });
    await this.prisma.fatoLojaMetaMes.delete({ where: { mesRef } });
    await this.auditar(u.id, 'loja_meta_mes_apagada', `fato_loja_meta_mes:${mes}`);
    return { ok: true };
  }

  /* ---------- Metas por curso ---------- */

  async listarMetasCurso(q: PaginacaoQuery) {
    const { skip, take, pagina, por_pagina } = this.pag(q);
    const where: Prisma.FatoLojaMetaCursoWhereInput = {};
    if (q.mes) where.mesRef = mesDate(q.mes);
    if (q.curso) where.curso = { contains: q.curso, mode: 'insensitive' };
    const [total, rows] = await Promise.all([
      this.prisma.fatoLojaMetaCurso.count({ where }),
      this.prisma.fatoLojaMetaCurso.findMany({
        where, skip, take, orderBy: [{ mesRef: 'desc' }, { curso: 'asc' }],
      }),
    ]);
    return {
      pagina, por_pagina, total,
      itens: rows.map((r) => ({
        mes_ref: isoMes(r.mesRef),
        curso: r.curso,
        meta_produtos: num(r.metaProdutos),
        meta_curso: num(r.metaCurso),
        meta_total: num(r.metaTotal),
        alunos: r.alunos,
        origem: r.origemDado,
        atualizado_em: r.atualizadoEm?.toISOString() ?? null,
      })),
    };
  }

  async upsertMetaCurso(dto: MetaCursoDto, u: UsuarioLogado) {
    const mesRef = mesDate(dto.mes_ref);
    const curso = dto.curso;
    const data = {
      metaProdutos: dec(dto.meta_produtos),
      metaCurso: dec(dto.meta_curso),
      metaTotal: dec(dto.meta_total),
      alunos: dto.alunos ?? null,
      atualizadoEm: new Date(),
      origemDado: 'cadastro',
    };
    const antes = await this.prisma.fatoLojaMetaCurso.findUnique({
      where: { mesRef_curso: { mesRef, curso } },
    });
    await this.prisma.fatoLojaMetaCurso.upsert({
      where: { mesRef_curso: { mesRef, curso } },
      create: { mesRef, curso, ...data },
      update: data,
    });
    await this.auditar(
      u.id,
      antes ? 'loja_meta_curso_atualizada' : 'loja_meta_curso_criada',
      `fato_loja_meta_curso:${dto.mes_ref}:${curso}`,
    );
    return { mes_ref: dto.mes_ref, curso };
  }

  async apagarMetaCurso(mes: string, curso: string, u: UsuarioLogado) {
    const mesRef = mesDate(mes);
    const antes = await this.prisma.fatoLojaMetaCurso.findUnique({
      where: { mesRef_curso: { mesRef, curso } },
    });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Meta não encontrada' });
    await this.prisma.fatoLojaMetaCurso.delete({
      where: { mesRef_curso: { mesRef, curso } },
    });
    await this.auditar(u.id, 'loja_meta_curso_apagada', `fato_loja_meta_curso:${mes}:${curso}`);
    return { ok: true };
  }

  /* ---------- Faturamento por curso ---------- */

  async listarFaturamento(q: PaginacaoQuery) {
    const { skip, take, pagina, por_pagina } = this.pag(q);
    const where: Prisma.FatoLojaCursoWhereInput = {};
    if (q.mes) where.mesRef = mesDate(q.mes);
    if (q.curso) where.curso = { contains: q.curso, mode: 'insensitive' };
    const [total, rows] = await Promise.all([
      this.prisma.fatoLojaCurso.count({ where }),
      this.prisma.fatoLojaCurso.findMany({
        where, skip, take, orderBy: [{ mesRef: 'desc' }, { curso: 'asc' }],
      }),
    ]);
    return {
      pagina, por_pagina, total,
      itens: rows.map((r) => ({
        id: Number(r.id),
        mes_ref: isoMes(r.mesRef),
        ano: r.ano,
        mes_nome: r.mesNome,
        periodo: r.periodo,
        curso: r.curso,
        turma: r.turma,
        treinador: r.treinador,
        dinheiro: num(r.dinheiro),
        debito: num(r.debito),
        credito: num(r.credito),
        pix: num(r.pix),
        total: num(r.total),
        meta: num(r.meta),
        alunos: r.alunos,
        ticket_medio: num(r.ticketMedio),
        origem: r.origemDado,
        atualizado_em: r.atualizadoEm?.toISOString() ?? null,
      })),
    };
  }

  async criarFaturamento(dto: FaturamentoCursoDto, u: UsuarioLogado) {
    const mesRef = mesDate(dto.mes_ref);
    const ano = Number(dto.mes_ref.slice(0, 4));
    const mesNome = MESES[Number(dto.mes_ref.slice(5, 7))] || null;
    const row = await this.prisma.fatoLojaCurso.create({
      data: {
        mesRef,
        ano,
        mesNome,
        periodo: dto.periodo ?? null,
        curso: dto.curso,
        turma: dto.turma ?? '',
        treinador: dto.treinador ?? '',
        dinheiro: dec(dto.dinheiro),
        debito: dec(dto.debito),
        credito: dec(dto.credito),
        pix: dec(dto.pix),
        total: dec(dto.total),
        meta: dec(dto.meta),
        alunos: dto.alunos ?? null,
        ticketMedio: dec(dto.ticket_medio),
        atualizadoEm: new Date(),
        origemDado: 'cadastro',
      },
    });
    await this.auditar(u.id, 'loja_curso_criado', `fato_loja_curso:${row.id}`);
    return { id: Number(row.id) };
  }

  async atualizarFaturamento(id: number, dto: FaturamentoCursoDto, u: UsuarioLogado) {
    const antes = await this.prisma.fatoLojaCurso.findUnique({ where: { id: BigInt(id) } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Registro não encontrado' });
    const mesRef = mesDate(dto.mes_ref);
    const ano = Number(dto.mes_ref.slice(0, 4));
    const mesNome = MESES[Number(dto.mes_ref.slice(5, 7))] || null;
    await this.prisma.fatoLojaCurso.update({
      where: { id: BigInt(id) },
      data: {
        mesRef,
        ano,
        mesNome,
        periodo: dto.periodo ?? null,
        curso: dto.curso,
        turma: dto.turma ?? '',
        treinador: dto.treinador ?? '',
        dinheiro: dec(dto.dinheiro),
        debito: dec(dto.debito),
        credito: dec(dto.credito),
        pix: dec(dto.pix),
        total: dec(dto.total),
        meta: dec(dto.meta),
        alunos: dto.alunos ?? null,
        ticketMedio: dec(dto.ticket_medio),
        atualizadoEm: new Date(),
        origemDado: 'cadastro',
      },
    });
    await this.auditar(u.id, 'loja_curso_atualizado', `fato_loja_curso:${id}`);
    return { id };
  }

  async apagarFaturamento(id: number, u: UsuarioLogado) {
    const antes = await this.prisma.fatoLojaCurso.findUnique({ where: { id: BigInt(id) } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Registro não encontrado' });
    await this.prisma.fatoLojaCurso.delete({ where: { id: BigInt(id) } });
    await this.auditar(u.id, 'loja_curso_apagado', `fato_loja_curso:${id}`);
    return { ok: true };
  }

  /* ---------- Receitas extras ---------- */

  async listarReceitas(q: PaginacaoQuery) {
    const { skip, take, pagina, por_pagina } = this.pag(q);
    const where: Prisma.FatoLojaReceitaExtraWhereInput = {};
    if (q.mes) where.mesRef = mesDate(q.mes);
    if (q.fonte) where.fonte = { contains: q.fonte, mode: 'insensitive' };
    const [total, rows] = await Promise.all([
      this.prisma.fatoLojaReceitaExtra.count({ where }),
      this.prisma.fatoLojaReceitaExtra.findMany({
        where, skip, take, orderBy: [{ dataVenda: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return {
      pagina, por_pagina, total,
      itens: rows.map((r) => ({
        id: Number(r.id),
        fonte: r.fonte,
        data_venda: isoMes(r.dataVenda),
        mes_ref: isoMes(r.mesRef),
        descricao: r.descricao,
        forma_pagto: r.formaPagto,
        valor: num(r.valor),
        quantidade: num(r.quantidade),
        cliente: r.cliente,
        documento: r.documento,
        observacao: r.observacao,
        chave_origem: r.chaveOrigem,
        origem: r.origemDado,
        atualizado_em: r.atualizadoEm?.toISOString() ?? null,
      })),
    };
  }

  async criarReceita(dto: ReceitaExtraDto, u: UsuarioLogado) {
    const chave =
      dto.chave_origem?.trim() ||
      createHash('md5')
        .update([dto.fonte, dto.data_venda ?? '', dto.descricao ?? '', dto.valor ?? '', dto.cliente ?? '', Date.now()].join('|'))
        .digest('hex')
        .slice(0, 32);
    const row = await this.prisma.fatoLojaReceitaExtra.create({
      data: {
        fonte: dto.fonte,
        dataVenda: dto.data_venda ? new Date(`${dto.data_venda}T00:00:00Z`) : null,
        mesRef: dto.mes_ref ? mesDate(dto.mes_ref) : null,
        descricao: dto.descricao ?? null,
        formaPagto: dto.forma_pagto ?? null,
        valor: dec(dto.valor),
        quantidade: dec(dto.quantidade),
        cliente: dto.cliente ?? null,
        documento: dto.documento ?? null,
        observacao: dto.observacao ?? null,
        chaveOrigem: chave,
        atualizadoEm: new Date(),
        origemDado: 'cadastro',
      },
    });
    await this.auditar(u.id, 'loja_receita_criada', `fato_loja_receita_extra:${row.id}`);
    return { id: Number(row.id) };
  }

  async atualizarReceita(id: number, dto: ReceitaExtraDto, u: UsuarioLogado) {
    const antes = await this.prisma.fatoLojaReceitaExtra.findUnique({ where: { id: BigInt(id) } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Registro não encontrado' });
    await this.prisma.fatoLojaReceitaExtra.update({
      where: { id: BigInt(id) },
      data: {
        fonte: dto.fonte,
        dataVenda: dto.data_venda ? new Date(`${dto.data_venda}T00:00:00Z`) : null,
        mesRef: dto.mes_ref ? mesDate(dto.mes_ref) : null,
        descricao: dto.descricao ?? null,
        formaPagto: dto.forma_pagto ?? null,
        valor: dec(dto.valor),
        quantidade: dec(dto.quantidade),
        cliente: dto.cliente ?? null,
        documento: dto.documento ?? null,
        observacao: dto.observacao ?? null,
        chaveOrigem: dto.chave_origem ?? antes.chaveOrigem,
        atualizadoEm: new Date(),
        origemDado: 'cadastro',
      },
    });
    await this.auditar(u.id, 'loja_receita_atualizada', `fato_loja_receita_extra:${id}`);
    return { id };
  }

  async apagarReceita(id: number, u: UsuarioLogado) {
    const antes = await this.prisma.fatoLojaReceitaExtra.findUnique({ where: { id: BigInt(id) } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Registro não encontrado' });
    await this.prisma.fatoLojaReceitaExtra.delete({ where: { id: BigInt(id) } });
    await this.auditar(u.id, 'loja_receita_apagada', `fato_loja_receita_extra:${id}`);
    return { ok: true };
  }

  /* ---------- Fechamento ---------- */

  async listarFechamento(q: PaginacaoQuery) {
    const { skip, take, pagina, por_pagina } = this.pag(q);
    const where = q.mes ? { mesRef: mesDate(q.mes) } : {};
    const [total, rows] = await Promise.all([
      this.prisma.fatoLojaFechamento.count({ where }),
      this.prisma.fatoLojaFechamento.findMany({
        where, skip, take, orderBy: { mesRef: 'desc' },
      }),
    ]);
    return {
      pagina, por_pagina, total,
      itens: rows.map((r) => ({
        mes_ref: isoMes(r.mesRef),
        ano: r.ano,
        mes_nome: r.mesNome,
        faturamento: num(r.faturamento),
        meta_minima: num(r.metaMinima),
        meta_basica: num(r.metaBasica),
        meta_master: num(r.metaMaster),
        detalhe: r.detalhe,
        origem: r.origemDado,
        atualizado_em: r.atualizadoEm?.toISOString() ?? null,
      })),
    };
  }

  async upsertFechamento(dto: FechamentoDto, u: UsuarioLogado) {
    const mesRef = mesDate(dto.mes_ref);
    const ano = Number(dto.mes_ref.slice(0, 4));
    const mesNome = MESES[Number(dto.mes_ref.slice(5, 7))] || null;
    const data = {
      ano,
      mesNome,
      faturamento: dec(dto.faturamento),
      metaMinima: dec(dto.meta_minima),
      metaBasica: dec(dto.meta_basica),
      metaMaster: dec(dto.meta_master),
      detalhe: dto.detalhe ?? null,
      atualizadoEm: new Date(),
      origemDado: 'cadastro',
    };
    const antes = await this.prisma.fatoLojaFechamento.findUnique({ where: { mesRef } });
    await this.prisma.fatoLojaFechamento.upsert({
      where: { mesRef },
      create: { mesRef, ...data },
      update: data,
    });
    await this.auditar(
      u.id,
      antes ? 'loja_fechamento_atualizado' : 'loja_fechamento_criado',
      `fato_loja_fechamento:${dto.mes_ref}`,
    );
    return { mes_ref: dto.mes_ref };
  }

  async apagarFechamento(mes: string, u: UsuarioLogado) {
    const mesRef = mesDate(mes);
    const antes = await this.prisma.fatoLojaFechamento.findUnique({ where: { mesRef } });
    if (!antes) throw new NotFoundException({ codigo: 'NAO_ENCONTRADO', message: 'Fechamento não encontrado' });
    await this.prisma.fatoLojaFechamento.delete({ where: { mesRef } });
    await this.auditar(u.id, 'loja_fechamento_apagado', `fato_loja_fechamento:${mes}`);
    return { ok: true };
  }

  private pag(q: PaginacaoQuery) {
    const pagina = q.pagina ?? 1;
    const por_pagina = q.por_pagina ?? 50;
    if (pagina < 1 || por_pagina < 1) {
      throw new BadRequestException({ codigo: 'PAGINACAO', message: 'pagina/por_pagina inválidos' });
    }
    return { pagina, por_pagina, skip: (pagina - 1) * por_pagina, take: por_pagina };
  }

  private async auditar(
    usuarioId: string,
    acao: string,
    recurso: string,
    detalhe?: unknown,
  ) {
    await this.prisma.auditoriaAcesso
      .create({
        data: {
          usuarioId,
          acao,
          recurso,
          detalhe: detalhe == null ? undefined : (detalhe as Prisma.InputJsonValue),
        },
      })
      .catch(() => undefined);
  }
}
