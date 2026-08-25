import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Processo } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AtualizarProcessoDto, CriarProcessoDto, EntregaDto, TransicaoDto } from './processos.dto';
import { calcularProgresso } from './calculos';

const mutavel = (p: Processo) => !['aprovado', 'implantado', 'arquivado', 'substituido'].includes(p.situacao);
const json = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

@Injectable()
export class ProcessosService {
  constructor(private readonly prisma: PrismaService) {}

  async visaoGeral() {
    const grupos = await this.prisma.processo.groupBy({ by: ['situacao'], _count: true });
    const recentes = await this.prisma.processo.findMany({ take: 6, orderBy: { atualizadoEm: 'desc' } });
    return { total: grupos.reduce((s, g) => s + g._count, 0), porSituacao: Object.fromEntries(grupos.map((g) => [g.situacao, g._count])), recentes };
  }

  listar(busca?: string, situacao?: string, setor?: string) {
    return this.prisma.processo.findMany({
      where: {
        ...(situacao ? { situacao } : {}), ...(setor ? { setorPrincipal: setor } : {}),
        ...(busca ? { OR: [{ nome: { contains: busca, mode: 'insensitive' } }, { codigo: { contains: busca, mode: 'insensitive' } }, { descricao: { contains: busca, mode: 'insensitive' } }] } : {}),
      }, orderBy: { atualizadoEm: 'desc' }, take: 100,
    });
  }

  async obter(id: string) {
    const item = await this.prisma.processo.findUnique({ where: { id }, include: { versoes: { orderBy: { numero: 'desc' } }, auditoria: { orderBy: { criadaEm: 'desc' }, take: 100 } } });
    if (!item) throw new NotFoundException('Processo não encontrado.');
    return item;
  }

  criar(dto: CriarProcessoDto, u: UsuarioLogado) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.processo.create({ data: { ...dto, codigo: dto.codigo.trim().toUpperCase(), criadoPor: u.id, atualizadoPor: u.id } });
      await tx.processoAuditoria.create({ data: { processoId: p.id, usuarioId: u.id, acao: 'criado', novo: json(p), versao: 1 } });
      return p;
    });
  }

  async atualizar(id: string, dto: AtualizarProcessoDto, u: UsuarioLogado) {
    const anterior = await this.obter(id);
    if (!mutavel(anterior)) throw new ConflictException('Versão aprovada é imutável. Crie uma nova versão para alterar.');
    if (anterior.revisao !== dto.revisao) throw new ConflictException('Este processo foi alterado por outra pessoa. Recarregue antes de salvar.');
    const { revisao: _, motivo, entrevista, manual, ...dados } = dto;
    return this.prisma.$transaction(async (tx) => {
      const novo = await tx.processo.update({ where: { id }, data: { ...dados, ...(entrevista ? { entrevista: json(entrevista) } : {}), ...(manual ? { manual: json(manual) } : {}), atualizadoPor: u.id, revisao: { increment: 1 } } });
      await tx.processoAuditoria.create({ data: { processoId: id, usuarioId: u.id, acao: 'atualizado', anterior: json(anterior), novo: json(novo), motivo, versao: novo.versaoAtual } });
      return novo;
    });
  }

  async transicionar(id: string, dto: TransicaoDto, u: UsuarioLogado) {
    const p = await this.obter(id);
    const mapa: Record<string, string> = { enviar_validacao: 'aguardando_validacao', solicitar_ajustes: 'ajustes_solicitados', rejeitar: 'ajustes_solicitados', aprovar: 'aprovado', publicar: 'implantado' };
    if (dto.acao === 'aprovar' && p.criadoPor === u.id && u.papel !== 'admin') throw new ForbiddenException('O mapeador não pode aprovar o próprio processo.');
    if (['solicitar_ajustes', 'rejeitar'].includes(dto.acao) && !dto.motivo?.trim()) throw new ConflictException('Informe a justificativa.');
    return this.prisma.$transaction(async (tx) => {
      const novo = await tx.processo.update({ where: { id }, data: { situacao: mapa[dto.acao], atualizadoPor: u.id, revisao: { increment: 1 } } });
      if (dto.acao === 'aprovar') await tx.processoVersao.create({ data: { processoId: id, numero: p.versaoAtual, situacao: 'aprovado', snapshot: json(p), motivo: dto.motivo, criadaPor: u.id } });
      await tx.processoAuditoria.create({ data: { processoId: id, usuarioId: u.id, acao: dto.acao, anterior: json({ situacao: p.situacao }), novo: json({ situacao: novo.situacao }), motivo: dto.motivo, versao: p.versaoAtual } });
      return novo;
    });
  }

  async novaVersao(id: string, motivo: string, u: UsuarioLogado) {
    const p = await this.obter(id);
    if (p.situacao !== 'aprovado' && p.situacao !== 'implantado') throw new ConflictException('Apenas processos aprovados ou publicados geram nova versão.');
    return this.prisma.processo.update({ where: { id }, data: { versaoAtual: { increment: 1 }, situacao: 'rascunho', atualizadoPor: u.id, revisao: { increment: 1 }, auditoria: { create: { usuarioId: u.id, acao: 'nova_versao', motivo, versao: p.versaoAtual + 1 } } } });
  }

  /** Arquiva: nao apaga, muda a situacao para 'arquivado' (sai das listas
   *  ativas mas preserva versoes/auditoria). Reversivel por restaurar(). */
  async arquivar(id: string, motivo: string, u: UsuarioLogado) {
    const p = await this.obter(id);
    if (p.situacao === 'arquivado') throw new ConflictException('Processo já está arquivado.');
    return this.prisma.processo.update({
      where: { id },
      data: { situacao: 'arquivado', atualizadoPor: u.id, revisao: { increment: 1 },
        auditoria: { create: { usuarioId: u.id, acao: 'arquivado', anterior: json({ situacao: p.situacao }), novo: json({ situacao: 'arquivado' }), motivo, versao: p.versaoAtual } } },
    });
  }

  /** Restaura um processo arquivado, voltando para rascunho. */
  async restaurar(id: string, u: UsuarioLogado) {
    const p = await this.obter(id);
    if (p.situacao !== 'arquivado') throw new ConflictException('Só é possível restaurar um processo arquivado.');
    return this.prisma.processo.update({
      where: { id },
      data: { situacao: 'rascunho', atualizadoPor: u.id, revisao: { increment: 1 },
        auditoria: { create: { usuarioId: u.id, acao: 'restaurado', anterior: json({ situacao: 'arquivado' }), novo: json({ situacao: 'rascunho' }), versao: p.versaoAtual } } },
    });
  }

  async implantacao() {
    const entregas = await this.prisma.implantacaoEntrega.findMany({ orderBy: [{ setor: 'asc' }, { pilar: 'asc' }] });
    const pendencias = await this.prisma.implantacaoPendencia.findMany({ where: { situacao: { not: 'resolvida' } }, orderBy: { prazo: 'asc' } });
    const progresso = calcularProgresso(entregas.map((e) => ({ pilar: e.pilar as 'sistema' | 'automacao' | 'agentes_ia', peso: Number(e.peso), situacao: e.situacao, percentualAceito: Number(e.percentualAceito) })));
    return { ...progresso, entregas, pendencias, pesos: { sistema: 60, automacao: 25, agentesIa: 15 } };
  }

  criarEntrega(dto: EntregaDto) { return this.prisma.implantacaoEntrega.create({ data: dto }); }
}
