import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AbrirCaixaDto, CancelarVendaDto, FecharCaixaDto, MovimentoCaixaDto, RegistrarVendaDto } from './pdv.dto';

const operador = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('pdv.operar');
const gestor = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('pdv.gerenciar');
const jsonSeguro = <T>(v: T): T => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));
const D = (n: number | string) => new Prisma.Decimal(n);

@Injectable()
export class PdvService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------- CATÁLOGO / CONTEXTO --------------------

  async terminais() {
    return this.prisma.pdvTerminal.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  /** Produtos vendáveis a partir do catálogo operacional da Loja (loja_produtos + loja_estoque_saldos).
   *  Somente produtos ativos e com vende_pdv=true são retornados.
   *  O saldo considerado é sempre o do local LOJA. */
  async produtos(busca = '') {
    const rows = await this.prisma.lojaProduto.findMany({
      where: {
        ativo: true,
        vendePdv: true,
        ...(busca ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { sku: { contains: busca, mode: 'insensitive' } },
            { codigoBarras: { contains: busca, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        saldos: { where: { local: 'LOJA' } },
        categoria: { select: { nome: true, cor: true } },
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      take: 50,
    });
    return rows.map((p) => {
      const saldo = p.saldos[0];
      const saldoFisico = Number(saldo?.saldoFisico ?? 0);
      const reservado = Number(saldo?.reservado ?? 0);
      return {
        produtoId: p.id,
        codigo: p.sku ?? p.codigoBarras ?? '',
        descricao: p.nome,
        preco: Number(p.preco),
        saldo: saldoFisico,
        reservado,
        disponivel: saldoFisico - reservado,
        categoria: p.categoria?.nome ?? null,
        precisaPreparacao: p.precisaPreparacao,
        controlaEstoque: p.controlaEstoque,
        imagemUrl: p.imagemUrl ?? null,
      };
    });
  }

  /** Sessão de caixa aberta do operador (ou null). Usada pela tela ao abrir. */
  async sessaoAtual(u: UsuarioLogado) {
    const s = await this.prisma.pdvCaixaSessao.findFirst({
      where: { situacao: 'aberto', abertoPorId: u.id },
      include: { terminal: true, movimentos: { orderBy: { criadoEm: 'desc' } } },
      orderBy: { abertoEm: 'desc' },
    });
    return s ? jsonSeguro(s) : null;
  }

  // -------------------- CAIXA --------------------

  async abrirCaixa(dto: AbrirCaixaDto, u: UsuarioLogado) {
    if (!operador(u)) throw new ForbiddenException('Seu perfil não pode operar o PDV.');
    const terminal = await this.prisma.pdvTerminal.findUnique({ where: { id: dto.terminalId } });
    if (!terminal || !terminal.ativo) throw new NotFoundException('Terminal indisponível.');
    const abertaTerminal = await this.prisma.pdvCaixaSessao.findFirst({ where: { terminalId: dto.terminalId, situacao: 'aberto' } });
    if (abertaTerminal) throw new ConflictException('Já existe um caixa aberto neste terminal.');
    const abertaOperador = await this.prisma.pdvCaixaSessao.findFirst({ where: { abertoPorId: u.id, situacao: 'aberto' } });
    if (abertaOperador) throw new ConflictException('Você já tem um caixa aberto. Feche-o antes de abrir outro.');
    return this.prisma.pdvCaixaSessao.create({
      data: { terminalId: dto.terminalId, abertoPorId: u.id, abertoPorNome: u.nome, fundoAbertura: D(dto.fundoAbertura) },
      include: { terminal: true },
    });
  }

  private async sessaoDoOperador(sessaoId: string, u: UsuarioLogado) {
    const s = await this.prisma.pdvCaixaSessao.findUnique({ where: { id: sessaoId } });
    if (!s) throw new NotFoundException('Caixa não encontrado.');
    if (s.situacao !== 'aberto') throw new BadRequestException('Este caixa não está aberto.');
    if (s.abertoPorId !== u.id && !gestor(u)) throw new ForbiddenException('Este caixa é de outro operador.');
    return s;
  }

  async movimentarCaixa(sessaoId: string, dto: MovimentoCaixaDto, u: UsuarioLogado) {
    if (!operador(u)) throw new ForbiddenException();
    await this.sessaoDoOperador(sessaoId, u);
    return this.prisma.pdvCaixaMovimento.create({
      data: { sessaoId, tipo: dto.tipo, valor: D(dto.valor), motivo: dto.motivo ?? '', operadorId: u.id, operadorNome: u.nome },
    });
  }

  /** Dinheiro esperado no caixa = fundo + vendas em dinheiro + reforços − sangrias. */
  private async esperadoDinheiro(tx: Prisma.TransactionClient, sessaoId: string, fundo: Prisma.Decimal) {
    const vendasDinheiro = await tx.pdvVendaPagamento.aggregate({
      _sum: { valor: true },
      where: { formaPagamento: 'Dinheiro', venda: { sessaoId, situacao: 'fechada' } },
    });
    const movimentos = await tx.pdvCaixaMovimento.findMany({ where: { sessaoId } });
    const reforcos = movimentos.filter((m) => m.tipo === 'reforco').reduce((s, m) => s.plus(m.valor), D(0));
    const sangrias = movimentos.filter((m) => m.tipo === 'sangria').reduce((s, m) => s.plus(m.valor), D(0));
    return fundo.plus(vendasDinheiro._sum.valor ?? 0).plus(reforcos).minus(sangrias);
  }

  async fecharCaixa(sessaoId: string, dto: FecharCaixaDto, u: UsuarioLogado) {
    if (!operador(u)) throw new ForbiddenException();
    const s = await this.sessaoDoOperador(sessaoId, u);
    return this.prisma.$transaction(async (tx) => {
      const esperado = await this.esperadoDinheiro(tx, sessaoId, s.fundoAbertura);
      const contado = D(dto.contadoDinheiro);
      return tx.pdvCaixaSessao.update({
        where: { id: sessaoId },
        data: { situacao: 'fechado', fechadoEm: new Date(), contadoDinheiro: contado, esperadoDinheiro: esperado, diferenca: contado.minus(esperado) },
        include: { terminal: true },
      });
    });
  }

  /** Resumo de uma sessão para a tela de fechamento (totais por forma). */
  async resumoSessao(sessaoId: string, u: UsuarioLogado) {
    const s = await this.sessaoDoOperador(sessaoId, u).catch(async () => {
      const found = await this.prisma.pdvCaixaSessao.findUnique({ where: { id: sessaoId } });
      if (!found) throw new NotFoundException('Caixa não encontrado.');
      if (found.abertoPorId !== u.id && !gestor(u)) throw new ForbiddenException();
      return found;
    });
    const [porForma, movimentos, esperado] = await Promise.all([
      this.prisma.pdvVendaPagamento.groupBy({ by: ['formaPagamento'], _sum: { valor: true }, _count: true, where: { venda: { sessaoId, situacao: 'fechada' } } }),
      this.prisma.pdvCaixaMovimento.findMany({ where: { sessaoId }, orderBy: { criadoEm: 'desc' } }),
      this.prisma.$transaction((tx) => this.esperadoDinheiro(tx, sessaoId, s.fundoAbertura)),
    ]);
    return jsonSeguro({
      sessao: s,
      formas: porForma.map((f) => ({ forma: f.formaPagamento, valor: Number(f._sum.valor ?? 0), transacoes: f._count })),
      movimentos,
      esperadoDinheiro: Number(esperado),
    });
  }

  // -------------------- VENDA (o coração da integração) --------------------

  async registrarVenda(dto: RegistrarVendaDto, u: UsuarioLogado) {
    if (!operador(u)) throw new ForbiddenException('Seu perfil não pode operar o PDV.');
    const sessao = await this.sessaoDoOperador(dto.sessaoId, u);

    const subtotal = dto.itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0);
    const desconto = Math.min(dto.desconto ?? 0, subtotal);
    const total = +(subtotal - desconto).toFixed(2);
    const pago = dto.pagamentos.reduce((s, p) => s + p.valor, 0);
    if (Math.abs(pago - total) > 0.01) throw new BadRequestException(`O total dos pagamentos (${pago.toFixed(2)}) não fecha com o valor da venda (${total.toFixed(2)}).`);

    // Conta de receita padrão do PDV (para o rateio da DRE), se existir.
    const [contaVenda, centroComercial] = await Promise.all([
      this.prisma.financeiroPlanoConta.findFirst({ where: { disponivelPdv: true } }),
      this.prisma.financeiroCentroCusto.findFirst({ where: { nome: 'Comercial' } }),
    ]);

    return this.prisma.$transaction(async (tx) => {
      // 1) Numeração sequencial da venda (advisory lock por dia, como Compras faz).
      const ano = new Date().getUTCFullYear();
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(778201)`;
      const ultima = await tx.pdvVenda.findFirst({ where: { numero: { startsWith: `V-${ano}-` } }, orderBy: { numero: 'desc' }, select: { numero: true } });
      const seq = String(Number(ultima?.numero.split('-').at(-1) ?? 0) + 1).padStart(6, '0');

      // 2) Baixa de estoque + ledger, item a item. Só produtos reais e que controlam estoque baixam.
      for (const it of dto.itens) {
        if (!it.produtoId) continue; // linha livre (serviço) não movimenta estoque
        const produto = await tx.lojaProduto.findUnique({
          where: { id: it.produtoId },
          include: { saldos: { where: { local: 'LOJA' } } },
        });
        if (!produto) throw new BadRequestException(`Produto ${it.descricao} não encontrado no catálogo.`);
        if (!produto.controlaEstoque) continue; // produto sem controle de estoque: não baixa saldo

        const saldo = produto.saldos[0];
        const saldoFisico = Number(saldo?.saldoFisico ?? 0);
        const reservado = Number(saldo?.reservado ?? 0);
        const disponivel = saldoFisico - reservado;
        if (it.quantidade > disponivel) {
          throw new ConflictException(`Estoque insuficiente para "${produto.nome}" (disponível: ${disponivel}, solicitado: ${it.quantidade}).`);
        }

        // Decrementa saldo fisico no local LOJA (upsert garante a linha existir)
        await tx.lojaEstoqueSaldo.upsert({
          where: { produtoId_local: { produtoId: it.produtoId, local: 'LOJA' } },
          create: { produtoId: it.produtoId, local: 'LOJA', saldoFisico: D(Math.max(0, saldoFisico - it.quantidade)) },
          update: { saldoFisico: { decrement: D(it.quantidade) } },
        });

        // Ledger nativo da Loja (rastreável)
        const novoSaldo = saldoFisico - it.quantidade;
        await tx.lojaEstoqueMovimento.create({
          data: {
            produtoId: it.produtoId,
            local: 'LOJA',
            tipo: 'saida',
            quantidade: D(it.quantidade),
            saldoApos: D(novoSaldo),
            origem: 'pdv',
            referenciaId: `V-${ano}-${seq}`,
            observacao: `Venda PDV - ${produto.nome}`,
            usuarioId: u.id,
          },
        });
      }

      // 3) A venda + itens + pagamentos.
      const venda = await tx.pdvVenda.create({
        data: {
          numero: `V-${ano}-${seq}`,
          canal: dto.canal ?? 'pdv',
          clienteNome: dto.clienteNome ?? '',
          clienteDocumento: dto.clienteDocumento,
          terminalId: sessao.terminalId,
          sessaoId: sessao.id,
          operadorId: u.id,
          operadorNome: u.nome,
          subtotal: D(subtotal),
          desconto: D(desconto),
          total: D(total),
          observacoes: dto.observacoes ?? '',
          itens: { create: dto.itens.map((i) => ({ lojaProdutoId: i.produtoId ?? undefined, descricao: i.descricao, quantidade: D(i.quantidade), precoUnit: D(i.precoUnit), total: D(+(i.quantidade * i.precoUnit).toFixed(2)) })) },
          pagamentos: { create: dto.pagamentos.map((p) => ({ formaPagamento: p.formaPagamento, valor: D(p.valor), bandeira: p.bandeira, parcelas: p.parcelas })) },
        },
        include: { itens: true, pagamentos: true },
      });

      // 4) Ledger do Compras removido (agora usamos LojaEstoqueMovimento acima).

      // 5) Recebível no Financeiro — venda à vista, já paga.
      await tx.financeiroLancamento.create({
        data: {
          operacao: 'receber', descricao: `Venda ${venda.numero}`, valor: D(total), valorPago: D(total),
          situacao: 'pago', dataCompetencia: new Date(), dataVencimento: new Date(), pagoEm: new Date(),
          contraparte: dto.clienteNome ?? 'Consumidor', formaPagamento: dto.pagamentos.map((p) => p.formaPagamento).join(', '),
          vendaId: venda.id, origem: 'pdv', criadoPorId: u.id,
          ...(contaVenda && centroComercial ? { rateios: { create: [{ planoContaId: contaVenda.id, centroCustoId: centroComercial.id, valor: D(total), percentual: D(100) }] } } : {}),
        },
      });

      return jsonSeguro(venda);
    });
  }

  async cancelarVenda(id: string, dto: CancelarVendaDto, u: UsuarioLogado) {
    if (!gestor(u)) throw new ForbiddenException('Cancelar venda exige permissão de gestão do PDV.');
    const venda = await this.prisma.pdvVenda.findUnique({ where: { id }, include: { itens: true } });
    if (!venda) throw new NotFoundException('Venda não encontrada.');
    if (venda.situacao === 'cancelada') throw new BadRequestException('Venda já cancelada.');
    return this.prisma.$transaction(async (tx) => {
      // devolve estoque no loja_estoque_saldos (local LOJA)
      for (const it of venda.itens) {
        if (!it.lojaProdutoId) continue;
        const produto = await tx.lojaProduto.findUnique({ where: { id: it.lojaProdutoId } });
        if (!produto || !produto.controlaEstoque) continue;
        await tx.lojaEstoqueSaldo.upsert({
          where: { produtoId_local: { produtoId: it.lojaProdutoId, local: 'LOJA' } },
          create: { produtoId: it.lojaProdutoId, local: 'LOJA', saldoFisico: it.quantidade },
          update: { saldoFisico: { increment: it.quantidade } },
        });
        await tx.lojaEstoqueMovimento.create({
          data: {
            produtoId: it.lojaProdutoId, local: 'LOJA', tipo: 'devolucao',
            quantidade: it.quantidade, origem: 'pdv',
            referenciaId: venda.numero,
            observacao: `Cancelamento venda ${venda.numero}`,
            usuarioId: u.id,
          },
        });
      }
      // estorna o recebível
      await tx.financeiroLancamento.updateMany({ where: { vendaId: venda.id, excluidoEm: null }, data: { excluidoEm: new Date() } });
      return tx.pdvVenda.update({ where: { id }, data: { situacao: 'cancelada', canceladaEm: new Date(), motivoCancelamento: dto.motivo } });
    });
  }

  // -------------------- CONSULTAS / INDICADORES --------------------

  async listarVendas(u: UsuarioLogado, busca?: string, situacao?: string) {
    return jsonSeguro(await this.prisma.pdvVenda.findMany({
      where: { ...(situacao ? { situacao } : {}), ...(busca ? { OR: [{ numero: { contains: busca, mode: 'insensitive' } }, { clienteNome: { contains: busca, mode: 'insensitive' } }] } : {}) },
      include: { itens: true, pagamentos: true },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    }));
  }

  async obterVenda(id: string) {
    const v = await this.prisma.pdvVenda.findUnique({ where: { id }, include: { itens: true, pagamentos: true, terminal: true } });
    if (!v) throw new NotFoundException('Venda não encontrada.');
    return jsonSeguro(v);
  }

  async indicadores() {
    const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
    const [agg, aggHoje, porForma] = await Promise.all([
      this.prisma.pdvVenda.aggregate({ _sum: { total: true }, _count: true, _avg: { total: true }, where: { situacao: 'fechada' } }),
      this.prisma.pdvVenda.aggregate({ _sum: { total: true }, _count: true, where: { situacao: 'fechada', criadoEm: { gte: hoje } } }),
      this.prisma.pdvVendaPagamento.groupBy({ by: ['formaPagamento'], _sum: { valor: true }, where: { venda: { situacao: 'fechada' } } }),
    ]);
    return {
      vendas: agg._count, faturamento: Number(agg._sum.total ?? 0), ticketMedio: Number(agg._avg.total ?? 0),
      vendasHoje: aggHoje._count, faturamentoHoje: Number(aggHoje._sum.total ?? 0),
      formas: porForma.map((f) => ({ forma: f.formaPagamento, valor: Number(f._sum.valor ?? 0) })).sort((a, b) => b.valor - a.valor),
    };
  }
}
