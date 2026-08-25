import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AtualizarLancamentoDto, CentroCustoDto, ContaBancariaDto, LancamentoDto, PagarLancamentoDto, PlanoContaDto } from './financeiro.dto';

const gestor = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('financeiro.gerenciar');
const D = (n: number | string) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------- CADASTROS DE APOIO --------------------

  async cadastros() {
    const [contas, centros, grupos, planos] = await Promise.all([
      this.prisma.financeiroContaBancaria.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
      this.prisma.financeiroCentroCusto.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
      this.prisma.financeiroGrupo.findMany({ orderBy: { ordem: 'asc' } }),
      this.prisma.financeiroPlanoConta.findMany({ orderBy: { nome: 'asc' } }),
    ]);
    return { contas, centros, grupos, planos };
  }
  criarConta(dto: ContaBancariaDto, u: UsuarioLogado) { this.exigeGestor(u); return this.prisma.financeiroContaBancaria.create({ data: { nome: dto.nome, banco: dto.banco ?? '', saldoInicial: D(dto.saldoInicial ?? 0) } }); }
  criarCentroCusto(dto: CentroCustoDto, u: UsuarioLogado) { this.exigeGestor(u); return this.prisma.financeiroCentroCusto.create({ data: { nome: dto.nome } }); }
  criarPlanoConta(dto: PlanoContaDto, u: UsuarioLogado) { this.exigeGestor(u); return this.prisma.financeiroPlanoConta.create({ data: { nome: dto.nome, grupoId: dto.grupoId, disponivelPdv: !!dto.disponivelPdv } }); }

  private exigeGestor(u: UsuarioLogado) { if (!gestor(u)) throw new ForbiddenException('Esta ação exige permissão de gestão financeira.'); }

  // -------------------- LANÇAMENTOS (contas a pagar/receber) --------------------

  async listar(operacao?: string, situacao?: string, busca?: string) {
    return jsonSeguro(await this.prisma.financeiroLancamento.findMany({
      where: { excluidoEm: null, ...(operacao ? { operacao } : {}), ...(situacao ? { situacao } : {}), ...(busca ? { OR: [{ descricao: { contains: busca, mode: 'insensitive' } }, { contraparte: { contains: busca, mode: 'insensitive' } }] } : {}) },
      include: { rateios: { include: { planoConta: true, centroCusto: true } }, contaBancaria: true },
      orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
      take: 200,
    }));
  }
  async obter(id: string) {
    const l = await this.prisma.financeiroLancamento.findFirst({ where: { id, excluidoEm: null }, include: { rateios: { include: { planoConta: true, centroCusto: true } }, contaBancaria: true } });
    if (!l) throw new NotFoundException('Lançamento não encontrado.');
    return jsonSeguro(l);
  }

  async criar(dto: LancamentoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const total = dto.valor + (dto.juros ?? 0) + (dto.multa ?? 0);
    if (dto.rateios?.length) {
      const somaR = dto.rateios.reduce((s, r) => s + r.valor, 0);
      if (Math.abs(somaR - total) > 0.01) throw new BadRequestException(`A soma do rateio (${somaR.toFixed(2)}) deve fechar com o total do lançamento (${total.toFixed(2)}).`);
    }
    return this.prisma.financeiroLancamento.create({
      data: {
        operacao: dto.operacao, descricao: dto.descricao, valor: D(dto.valor), juros: D(dto.juros ?? 0), multa: D(dto.multa ?? 0),
        dataCompetencia: new Date(dto.dataCompetencia), dataVencimento: new Date(dto.dataVencimento),
        contraparte: dto.contraparte ?? '', contaBancariaId: dto.contaBancariaId, observacao: dto.observacao ?? '', origem: 'manual', criadoPorId: u.id,
        ...(dto.rateios?.length ? { rateios: { create: dto.rateios.map((r) => ({ planoContaId: r.planoContaId, centroCustoId: r.centroCustoId, valor: D(r.valor), percentual: D(+((r.valor / total) * 100).toFixed(4)) })) } } : {}),
      },
      include: { rateios: true },
    });
  }

  async pagar(id: string, dto: PagarLancamentoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const l = await this.prisma.financeiroLancamento.findFirst({ where: { id, excluidoEm: null } });
    if (!l) throw new NotFoundException('Lançamento não encontrado.');
    if (l.situacao === 'pago') throw new BadRequestException('Lançamento já quitado.');
    const total = Number(l.valor) + Number(l.juros) + Number(l.multa);
    const novoPago = Number(l.valorPago) + dto.valor;
    if (novoPago > total + 0.01) throw new BadRequestException('O pagamento excede o valor em aberto.');
    return this.prisma.financeiroLancamento.update({
      where: { id },
      data: { valorPago: D(novoPago), situacao: novoPago >= total - 0.01 ? 'pago' : 'pendente', pagoEm: new Date(dto.pagoEm), formaPagamento: dto.formaPagamento, contaBancariaId: dto.contaBancariaId ?? l.contaBancariaId },
    });
  }

  async excluir(id: string, u: UsuarioLogado) {
    this.exigeGestor(u);
    const l = await this.prisma.financeiroLancamento.findFirst({ where: { id, excluidoEm: null } });
    if (!l) throw new NotFoundException('Lançamento não encontrado.');
    if (l.origem === 'pdv') throw new BadRequestException('Lançamento gerado pelo PDV — cancele a venda para estorná-lo.');
    return this.prisma.financeiroLancamento.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  async atualizar(id: string, dto: AtualizarLancamentoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const l = await this.prisma.financeiroLancamento.findFirst({ where: { id, excluidoEm: null } });
    if (!l) throw new NotFoundException('Lançamento não encontrado.');
    // Lançamentos do PDV são espelho da venda — editar aqui divergiria da origem.
    if (l.origem === 'pdv') throw new BadRequestException('Lançamento gerado pelo PDV não pode ser editado aqui — ajuste pela venda.');
    if (l.situacao === 'pago') throw new BadRequestException('Lançamento quitado não pode ser editado. Estorne o pagamento antes.');
    return this.prisma.financeiroLancamento.update({
      where: { id },
      data: {
        ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
        ...(dto.valor !== undefined ? { valor: D(dto.valor) } : {}),
        ...(dto.juros !== undefined ? { juros: D(dto.juros) } : {}),
        ...(dto.multa !== undefined ? { multa: D(dto.multa) } : {}),
        ...(dto.dataCompetencia !== undefined ? { dataCompetencia: new Date(dto.dataCompetencia) } : {}),
        ...(dto.dataVencimento !== undefined ? { dataVencimento: new Date(dto.dataVencimento) } : {}),
        ...(dto.contraparte !== undefined ? { contraparte: dto.contraparte } : {}),
        ...(dto.contaBancariaId !== undefined ? { contaBancariaId: dto.contaBancariaId } : {}),
        ...(dto.observacao !== undefined ? { observacao: dto.observacao } : {}),
      },
      include: { rateios: true },
    });
  }

  // -------------------- INDICADORES / DRE --------------------

  async indicadores() {
    const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
    const emAberto = (op: string) => this.prisma.financeiroLancamento.findMany({ where: { excluidoEm: null, operacao: op, situacao: 'pendente' }, select: { valor: true, juros: true, multa: true, valorPago: true, dataVencimento: true } });
    const [receber, pagar, realizado] = await Promise.all([
      emAberto('receber'), emAberto('pagar'),
      this.prisma.financeiroLancamento.groupBy({ by: ['operacao'], _sum: { valorPago: true }, where: { excluidoEm: null } }),
    ]);
    const restante = (l: { valor: Prisma.Decimal; juros: Prisma.Decimal; multa: Prisma.Decimal; valorPago: Prisma.Decimal }) => Number(l.valor) + Number(l.juros) + Number(l.multa) - Number(l.valorPago);
    const soma = (arr: typeof receber) => arr.reduce((s, l) => s + restante(l), 0);
    const vencido = (arr: typeof receber) => arr.filter((l) => l.dataVencimento < hoje).reduce((s, l) => s + restante(l), 0);
    const recebido = Number(realizado.find((r) => r.operacao === 'receber')?._sum.valorPago ?? 0);
    const pago = Number(realizado.find((r) => r.operacao === 'pagar')?._sum.valorPago ?? 0);
    return { aReceber: soma(receber), aPagar: soma(pagar), vencidoReceber: vencido(receber), vencidoPagar: vencido(pagar), caixaRealizado: recebido - pago };
  }

  /** DRE: receitas − despesas por grupo/conta, no período (por competência). */
  async dre(de?: string, ate?: string) {
    const where: Prisma.FinanceiroRateioWhereInput = { lancamento: { excluidoEm: null, ...(de || ate ? { dataCompetencia: { ...(de ? { gte: new Date(de) } : {}), ...(ate ? { lte: new Date(ate) } : {}) } } : {}) } };
    const rateios = await this.prisma.financeiroRateio.findMany({ where, include: { planoConta: { include: { grupo: true } }, centroCusto: true } });
    const grupos = new Map<string, { grupo: string; tipo: string; ordem: number; total: number; contas: Map<string, number> }>();
    for (const r of rateios) {
      const g = r.planoConta.grupo;
      const sinal = g.tipo === 'despesa' ? -1 : 1;
      const val = sinal * Number(r.valor);
      const atual = grupos.get(g.id) ?? { grupo: g.nome, tipo: g.tipo, ordem: g.ordem, total: 0, contas: new Map() };
      atual.total += val;
      atual.contas.set(r.planoConta.nome, (atual.contas.get(r.planoConta.nome) ?? 0) + val);
      grupos.set(g.id, atual);
    }
    const linhas = [...grupos.values()].sort((a, b) => a.ordem - b.ordem).map((g) => ({ grupo: g.grupo, tipo: g.tipo, total: +g.total.toFixed(2), contas: [...g.contas.entries()].map(([conta, valor]) => ({ conta, valor: +valor.toFixed(2) })).sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor)) }));
    const receitas = linhas.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.total, 0);
    const despesas = linhas.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.total, 0);
    return { linhas, receitas: +receitas.toFixed(2), despesas: +despesas.toFixed(2), resultado: +(receitas + despesas).toFixed(2) };
  }

  /** Saldo por conta bancária (inicial + recebido − pago). */
  async contasSaldo() {
    const contas = await this.prisma.financeiroContaBancaria.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
    const movs = await this.prisma.financeiroLancamento.groupBy({ by: ['contaBancariaId', 'operacao'], _sum: { valorPago: true }, where: { excluidoEm: null, contaBancariaId: { not: null } } });
    return contas.map((c) => {
      const rec = Number(movs.find((m) => m.contaBancariaId === c.id && m.operacao === 'receber')?._sum.valorPago ?? 0);
      const pag = Number(movs.find((m) => m.contaBancariaId === c.id && m.operacao === 'pagar')?._sum.valorPago ?? 0);
      return { id: c.id, nome: c.nome, banco: c.banco, saldoInicial: Number(c.saldoInicial), saldoAtual: +(Number(c.saldoInicial) + rec - pag).toFixed(2) };
    });
  }
}
