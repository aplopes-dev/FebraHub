import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import {
  AjusteEstoqueDto,
  CategoriaDto,
  ListaProdutosQuery,
  ProdutoDto,
  TransferenciaEstoqueDto,
} from './loja-produtos.dto';

const gestor = (u: UsuarioLogado) =>
  u.papel === 'admin' || u.permissoes.includes('loja.produtos.gerenciar');
const D = (n: number | string) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

const LOCAIS = ['LOJA', 'DEPOSITO'] as const;

@Injectable()
export class LojaProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  private exigeGestor(u: UsuarioLogado) {
    if (!gestor(u)) throw new ForbiddenException('Esta ação exige gestão do catálogo da Loja.');
  }

  // ==================== CATEGORIAS ====================

  listarCategorias() {
    return this.prisma.lojaCategoria.findMany({ orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] });
  }

  async criarCategoria(dto: CategoriaDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    return this.prisma.lojaCategoria.create({
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao ?? '',
        cor: dto.cor,
        icone: dto.icone,
        ordem: dto.ordem ?? 0,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async atualizarCategoria(id: string, dto: CategoriaDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    await this.exigeCategoria(id);
    return this.prisma.lojaCategoria.update({
      where: { id },
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao ?? '',
        cor: dto.cor,
        icone: dto.icone,
        ordem: dto.ordem ?? 0,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async apagarCategoria(id: string, u: UsuarioLogado) {
    this.exigeGestor(u);
    await this.exigeCategoria(id);
    const emUso = await this.prisma.lojaProduto.count({ where: { categoriaId: id } });
    if (emUso) throw new BadRequestException(`Categoria em uso por ${emUso} produto(s). Reatribua antes de apagar.`);
    await this.prisma.lojaCategoria.delete({ where: { id } });
    return { ok: true };
  }

  private async exigeCategoria(id: string) {
    const c = await this.prisma.lojaCategoria.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Categoria não encontrada.');
    return c;
  }

  // ==================== PRODUTOS ====================

  async listarProdutos(q: ListaProdutosQuery) {
    const situacao = q.situacao ?? 'ativos';
    const where: Prisma.LojaProdutoWhereInput = {
      ...(situacao === 'ativos' ? { ativo: true } : situacao === 'inativos' ? { ativo: false } : {}),
      ...(q.categoriaId ? { categoriaId: q.categoriaId } : {}),
      ...(q.busca
        ? {
            OR: [
              { nome: { contains: q.busca, mode: 'insensitive' } },
              { sku: { contains: q.busca, mode: 'insensitive' } },
              { codigoBarras: { contains: q.busca, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const produtos = await this.prisma.lojaProduto.findMany({
      where,
      include: { categoria: true, saldos: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      take: 300,
    });
    return jsonSeguro(produtos.map((p) => this.comEstoque(p)));
  }

  async obterProduto(id: string) {
    const p = await this.prisma.lojaProduto.findUnique({
      where: { id },
      include: { categoria: true, saldos: true },
    });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    return jsonSeguro(this.comEstoque(p));
  }

  /** Anexa saldo total/por-local e disponível ao produto. */
  private comEstoque<T extends { saldos: { local: string; saldoFisico: Prisma.Decimal; reservado: Prisma.Decimal }[] }>(
    p: T,
  ) {
    const porLocal: Record<string, { saldoFisico: number; reservado: number; disponivel: number }> = {};
    let saldoTotal = 0;
    let reservadoTotal = 0;
    for (const local of LOCAIS) {
      const s = p.saldos.find((x) => x.local === local);
      const fisico = Number(s?.saldoFisico ?? 0);
      const reservado = Number(s?.reservado ?? 0);
      porLocal[local] = { saldoFisico: fisico, reservado, disponivel: fisico - reservado };
      saldoTotal += fisico;
      reservadoTotal += reservado;
    }
    return {
      ...p,
      estoque: {
        porLocal,
        saldoTotal,
        reservadoTotal,
        disponivelTotal: saldoTotal - reservadoTotal,
      },
    };
  }

  async criarProduto(dto: ProdutoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    if (dto.categoriaId) await this.exigeCategoria(dto.categoriaId);
    const criado = await this.prisma.lojaProduto.create({
      data: this.dadosProduto(dto, u),
    });
    // Semeia os dois locais com saldo zero — a UI de estoque conta com eles.
    await this.prisma.lojaEstoqueSaldo.createMany({
      data: LOCAIS.map((local) => ({ produtoId: criado.id, local })),
      skipDuplicates: true,
    });
    return this.obterProduto(criado.id);
  }

  async atualizarProduto(id: string, dto: ProdutoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const atual = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Produto não encontrado.');
    if (dto.categoriaId) await this.exigeCategoria(dto.categoriaId);
    await this.prisma.lojaProduto.update({ where: { id }, data: this.dadosProduto(dto, u) });
    return this.obterProduto(id);
  }

  /** Inativa (soft) — nunca apaga, para preservar histórico de venda/estoque. */
  async inativarProduto(id: string, u: UsuarioLogado) {
    this.exigeGestor(u);
    const p = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    await this.prisma.lojaProduto.update({ where: { id }, data: { ativo: false } });
    return { ok: true };
  }

  private dadosProduto(dto: ProdutoDto, u: UsuarioLogado): Prisma.LojaProdutoCreateInput {
    return {
      nome: dto.nome.trim(),
      sku: dto.sku?.trim() || null,
      codigoBarras: dto.codigoBarras?.trim() || null,
      descricao: dto.descricao ?? '',
      imagemUrl: dto.imagemUrl || null,
      preco: D(dto.preco),
      custo: dto.custo != null ? D(dto.custo) : null,
      unidade: dto.unidade?.trim() || 'un',
      produtoEstoqueId: dto.produtoEstoqueId ? BigInt(dto.produtoEstoqueId) : null,
      ativo: dto.ativo ?? true,
      vendePdv: dto.vendePdv ?? true,
      exibeCardapio: dto.exibeCardapio ?? true,
      precisaPreparacao: dto.precisaPreparacao ?? false,
      controlaEstoque: dto.controlaEstoque ?? true,
      estoqueMinimo: D(dto.estoqueMinimo ?? 0),
      ordem: dto.ordem ?? 0,
      criadoPorId: u.id,
      ...(dto.categoriaId ? { categoria: { connect: { id: dto.categoriaId } } } : {}),
    };
  }

  // ==================== ESTOQUE (LOJA / DEPÓSITO) ====================

  /** Garante que existe a linha de saldo do (produto, local) e a devolve. */
  private async saldoOuZero(tx: Prisma.TransactionClient, produtoId: string, local: string) {
    const s = await tx.lojaEstoqueSaldo.findUnique({ where: { produtoId_local: { produtoId, local } } });
    if (s) return s;
    return tx.lojaEstoqueSaldo.create({ data: { produtoId, local } });
  }

  private async registrar(
    tx: Prisma.TransactionClient,
    produtoId: string,
    local: string,
    tipo: string,
    delta: Prisma.Decimal,
    origem: string,
    u: UsuarioLogado,
    observacao = '',
    referenciaId?: string,
  ) {
    const atual = await this.saldoOuZero(tx, produtoId, local);
    const novo = new Prisma.Decimal(atual.saldoFisico).plus(delta);
    if (novo.lessThan(0)) throw new BadRequestException(`Saldo insuficiente em ${local}.`);
    if (novo.lessThan(atual.reservado)) throw new BadRequestException(`Saldo em ${local} ficaria abaixo do reservado.`);
    await tx.lojaEstoqueSaldo.update({
      where: { produtoId_local: { produtoId, local } },
      data: { saldoFisico: novo },
    });
    await tx.lojaEstoqueMovimento.create({
      data: {
        produtoId,
        local,
        tipo,
        quantidade: delta,
        saldoApos: novo,
        origem,
        referenciaId,
        observacao,
        usuarioId: u.id,
      },
    });
    return novo;
  }

  /** Entrada, saída ou inventário (contagem que define o saldo absoluto). */
  async ajustarEstoque(produtoId: string, dto: AjusteEstoqueDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const p = await this.prisma.lojaProduto.findUnique({ where: { id: produtoId } });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    return this.prisma.$transaction(async (tx) => {
      if (dto.tipo === 'inventario') {
        const atual = await this.saldoOuZero(tx, produtoId, dto.local);
        const delta = D(dto.quantidade).minus(atual.saldoFisico);
        await this.registrar(tx, produtoId, dto.local, 'inventario', delta, 'manual', u, dto.observacao ?? `Inventário: ${dto.quantidade}`);
      } else {
        const delta = dto.tipo === 'entrada' ? D(dto.quantidade) : D(dto.quantidade).negated();
        await this.registrar(tx, produtoId, dto.local, dto.tipo, delta, 'manual', u, dto.observacao ?? '');
      }
      return this.obterProdutoTx(tx, produtoId);
    });
  }

  /** Transfere saldo entre LOJA e DEPÓSITO — duas pernas no mesmo ledger. */
  async transferirEstoque(produtoId: string, dto: TransferenciaEstoqueDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    if (dto.origem === dto.destino) throw new BadRequestException('Origem e destino devem ser diferentes.');
    const p = await this.prisma.lojaProduto.findUnique({ where: { id: produtoId } });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    const ref = crypto.randomUUID();
    return this.prisma.$transaction(async (tx) => {
      await this.registrar(tx, produtoId, dto.origem, 'transferencia', D(dto.quantidade).negated(), 'transferencia', u, dto.observacao ?? `→ ${dto.destino}`, ref);
      await this.registrar(tx, produtoId, dto.destino, 'transferencia', D(dto.quantidade), 'transferencia', u, dto.observacao ?? `← ${dto.origem}`, ref);
      return this.obterProdutoTx(tx, produtoId);
    });
  }

  async movimentosProduto(produtoId: string) {
    return jsonSeguro(
      await this.prisma.lojaEstoqueMovimento.findMany({
        where: { produtoId },
        orderBy: { criadoEm: 'desc' },
        take: 100,
      }),
    );
  }

  private async obterProdutoTx(tx: Prisma.TransactionClient, id: string) {
    const p = await tx.lojaProduto.findUnique({ where: { id }, include: { categoria: true, saldos: true } });
    return jsonSeguro(this.comEstoque(p!));
  }

  // ==================== INDICADORES ====================

  async indicadores() {
    const [totalProdutos, ativos, categorias, saldos] = await Promise.all([
      this.prisma.lojaProduto.count(),
      this.prisma.lojaProduto.count({ where: { ativo: true } }),
      this.prisma.lojaCategoria.count({ where: { ativo: true } }),
      this.prisma.lojaEstoqueSaldo.groupBy({ by: ['local'], _sum: { saldoFisico: true, reservado: true } }),
    ]);
    // Produtos ativos que controlam estoque e estão abaixo do mínimo (soma dos locais).
    const controlados = await this.prisma.lojaProduto.findMany({
      where: { ativo: true, controlaEstoque: true },
      select: { id: true, estoqueMinimo: true, saldos: { select: { saldoFisico: true } } },
    });
    const abaixoMinimo = controlados.filter((p) => {
      const total = p.saldos.reduce((s, x) => s + Number(x.saldoFisico), 0);
      return Number(p.estoqueMinimo) > 0 && total < Number(p.estoqueMinimo);
    }).length;
    return {
      totalProdutos,
      ativos,
      categorias,
      abaixoMinimo,
      porLocal: LOCAIS.map((local) => {
        const s = saldos.find((x) => x.local === local);
        return { local, saldoFisico: Number(s?._sum.saldoFisico ?? 0), reservado: Number(s?._sum.reservado ?? 0) };
      }),
    };
  }
}
