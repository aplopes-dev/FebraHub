import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { StorageService } from '../storage/storage.service';
import {
  AjusteEstoqueDto,
  CategoriaDto,
  ListaProdutosQuery,
  ProdutoDto,
  TransferenciaEstoqueDto,
} from './loja-produtos.dto';
import * as https from 'https';
import * as http from 'http';

/** Prefixo público do bucket onde vivem as imagens de produto da Loja. */
const PASTA_IMAGENS = 'loja/produtos';
/** Tipos aceitos no upload de imagem de produto. */
const MIME_IMAGEM: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const gestor = (u: UsuarioLogado) =>
  u.papel === 'admin' || u.permissoes.includes('loja.produtos.gerenciar');
/** Pode alterar PREÇO: quem tem a permissão dedicada (PRD §40) OU é gestor do
 *  catálogo (gerenciar já engloba editar o produto inteiro, incluindo preço). */
const podePreco = (u: UsuarioLogado) =>
  gestor(u) || u.permissoes.includes('loja.produtos.preco');
const D = (n: number | string) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

const LOCAIS = ['LOJA', 'DEPOSITO'] as const;

/** Inferência de categoria pelo nome do produto (Omie → Loja).
 *  A ordem das regras importa: mais específico primeiro. */
function inferirCategoria(nome: string): string {
  const n = nome.toUpperCase();
  if (/\bBOLSA\b|\bMOCHILA\b/.test(n))                                           return 'Bolsas';
  if (/\bCAMISA\b|\bCAMISETA\b|\bBONÉ\b|\bBONE\b|\bCOLAR\b|\bPULSEIRA\b|\bPOLO\b|\bMEIA\b/.test(n)) return 'Camisas';
  // Bebidas: palavras exatas — evita "CHARA", "CORAÇÃO" etc.
  if (/^CAFÉ$|^CHÁ$|^ÁGUA$|^ÁGUA COM GÁS$/.test(n.trim()))                       return 'Bebidas';
  if (/\bCAPPUCCINO\b|\b3CORACOES\b|\bCAPSULA\b|\bCÁPSULA\b|\bADOCANTE\b|\bADOÇANTE\b|\bACUCAR\b|\bAÇÚCAR\b/.test(n)) return 'Bebidas';
  if (/\bCAFÉ\b|\bCAFE\b/.test(n) && !/DECIFRE|CRIAÇÃO|CRIACAO/.test(n))         return 'Bebidas';
  if (/\bCHÁ\b|\bCHA\b/.test(n) && !/CHARA|CHARÁ/.test(n))                       return 'Bebidas';
  if (/\bÁGUA\b|\bAGUA\b/.test(n))                                                return 'Bebidas';
  if (/\bSUCO\b|\bBEBIDA\b/.test(n))                                              return 'Bebidas';
  if (/\bSACHÊ\b|\bSACHE\b|\bALIMENTO\b|\bLANCHE\b/.test(n))                    return 'Alimentos';
  if (/\bBOX\b|\bKIT\b|\bCOMBO\b/.test(n))                                       return 'Kits';
  if (/\bAPOSTILA\b|\bCADERNO\b|\bWORKBOOK\b/.test(n))                          return 'Apostilas';
  // Livros: começa com "LIVRO" ou termina com editora conhecida
  if (/^LIVRO\b/.test(n))                                                          return 'Livros';
  if (/\bCARDS\b|\bPLANNER\b|\bBÍBLIA\b|\bBIBLIA\b|\bAGENDA\b|\bHÁBITOS\b|\bHABITOS\b|\bPRINCÍPIOS\b|\bPRINCIPIOS\b/.test(n)) return 'Livros';
  if (/- (ACADEMIA|SEXTANTE|RECORD|RECORDS|VIDA|M BOOKS|MUNDO CRISTAO|NOVA ERA|HARPERCOLLINS|BEST SELLER|SARAIVA|ALTA BOOKS|UNIVERSO DOS LIVROS|MARFONTES|CHARA|CHARÁ|THOMAS NELSON|CDL|ATLAS|GENTE|PENSAMENTO|PORTICO|LETRA E VOZ|QUALITYMARK)$/.test(n)) return 'Livros';
  return 'Outros';
}

@Injectable()
export class LojaProdutosService {
  private readonly logger = new Logger(LojaProdutosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private exigeGestor(u: UsuarioLogado) {
    if (!gestor(u)) throw new ForbiddenException('Esta ação exige gestão do catálogo da Loja.');
  }

  // ==================== IMAGEM DE PRODUTO ====================

  /**
   * Sobe a imagem de um produto para o MinIO (prefixo público `loja/produtos/`)
   * e devolve a URL pública estável para gravar em `imagemUrl`. O fundo já vem
   * removido do front (PNG transparente), então aqui só validamos e guardamos.
   * O objeto vive sob UUID: o nome enviado pelo cliente não entra no caminho.
   */
  async enviarImagem(
    arquivo: { nomeOriginal: string; mimeDeclarado: string; conteudo: Buffer },
    u: UsuarioLogado,
  ) {
    this.exigeGestor(u);
    const mime = (arquivo.mimeDeclarado || '').toLowerCase().split(';')[0].trim();
    const ext = MIME_IMAGEM[mime];
    if (!ext) {
      throw new BadRequestException({
        codigo: 'IMAGEM_INVALIDA',
        message: 'Envie uma imagem PNG, JPG ou WEBP.',
      });
    }
    this.storage.validarTamanho(arquivo.conteudo.length);

    const chave = this.storage.montarChave(PASTA_IMAGENS, `imagem.${ext}`);
    await this.storage.upload(chave, arquivo.conteudo, mime);
    // Libera o prefixo para leitura anônima (idempotente) — a URL pública só
    // abre com essa policy; sem isso a imagem ficaria 403.
    await this.storage.garantirPrefixoPublico(`${PASTA_IMAGENS}/`);

    const url = this.storage.urlObjetoPublico(chave)
      ?? (await this.storage.urlAssinada(chave, 3600));
    return { url, chave };
  }

  /** Trilha de auditoria (PRD §48). Escreve direto na tabela compartilhada
   *  loja_auditoria — o catálogo não depende do módulo de pedidos. Best-effort:
   *  uma falha de auditoria nunca invalida a operação que a originou. */
  private async auditar(e: {
    entidadeId?: string | null; acao: string; antes?: unknown; depois?: unknown; observacao?: string;
  }, u: UsuarioLogado): Promise<void> {
    try {
      await this.prisma.lojaAuditoria.create({
        data: {
          entidade: 'produto', entidadeId: e.entidadeId ?? null, acao: e.acao, origem: 'operador',
          usuarioId: u.id, usuarioNome: u.nome,
          antes: e.antes === undefined ? undefined : (jsonSeguro(e.antes) as Prisma.InputJsonValue),
          depois: e.depois === undefined ? undefined : (jsonSeguro(e.depois) as Prisma.InputJsonValue),
          observacao: e.observacao ?? '',
        },
      });
    } catch {
      /* auditoria é acessória: silencia para não derrubar o cadastro */
    }
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
    void this.auditar({ entidadeId: criado.id, acao: 'produto.criado', depois: { nome: criado.nome, preco: Number(criado.preco) } }, u);
    return this.obterProduto(criado.id);
  }

  async atualizarProduto(id: string, dto: ProdutoDto, u: UsuarioLogado) {
    this.exigeGestor(u);
    const atual = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Produto não encontrado.');
    if (dto.categoriaId) await this.exigeCategoria(dto.categoriaId);
    await this.prisma.lojaProduto.update({ where: { id }, data: this.dadosProduto(dto, u) });

    // Auditoria de PREÇO (PRD §48): quando o preço muda, registra antes/depois.
    const precoAntes = Number(atual.preco);
    const precoDepois = Number(dto.preco);
    if (precoAntes !== precoDepois) {
      void this.auditar({
        entidadeId: id, acao: 'preco.alterado',
        antes: { preco: precoAntes }, depois: { preco: precoDepois },
        observacao: `${atual.nome}: ${precoAntes.toFixed(2)} → ${precoDepois.toFixed(2)}`,
      }, u);
    } else {
      void this.auditar({ entidadeId: id, acao: 'produto.alterado', observacao: atual.nome }, u);
    }
    return this.obterProduto(id);
  }

  /**
   * Altera SÓ o preço de venda (PRD §40-43). Endpoint dedicado com permissão
   * própria `loja.produtos.preco` — o usuário pode não ter gestão total do
   * catálogo, mas ter autorização para reprecificar. Valida no BACKEND (nunca
   * confia no front). Registra auditoria completa (produto, preço anterior,
   * preço novo, usuário, data/hora, origem, motivo). O novo preço passa a valer
   * imediatamente no Cardápio e no PDV (ambos leem LojaProduto.preco); pedidos
   * já pagos preservam o preço transacionado — nada é reescrito aqui (§43).
   */
  async alterarPreco(id: string, dto: { preco: number; motivo?: string }, u: UsuarioLogado) {
    if (!podePreco(u)) throw new ForbiddenException('Você não tem permissão para alterar preço de produtos.');
    if (dto.preco == null || Number.isNaN(dto.preco) || dto.preco < 0) {
      throw new BadRequestException('Preço inválido.');
    }
    const atual = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Produto não encontrado.');

    const precoAntes = Number(atual.preco);
    const precoDepois = Number(dto.preco);
    if (precoAntes === precoDepois) {
      // Idempotente: sem mudança, não gera ruído de auditoria.
      return this.obterProduto(id);
    }
    await this.prisma.lojaProduto.update({ where: { id }, data: { preco: D(precoDepois) } });
    void this.auditar({
      entidadeId: id, acao: 'preco.alterado',
      antes: { preco: precoAntes }, depois: { preco: precoDepois },
      observacao: `${atual.nome}: R$ ${precoAntes.toFixed(2)} → R$ ${precoDepois.toFixed(2)}` + (dto.motivo ? ` · ${dto.motivo.trim()}` : ''),
    }, u);
    return this.obterProduto(id);
  }

  /** Inativa (soft) — nunca apaga, para preservar histórico de venda/estoque. */
  async inativarProduto(id: string, u: UsuarioLogado) {
    this.exigeGestor(u);
    const p = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    await this.prisma.lojaProduto.update({ where: { id }, data: { ativo: false } });
    void this.auditar({ entidadeId: id, acao: 'produto.inativado', antes: { ativo: true }, depois: { ativo: false }, observacao: p.nome }, u);
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
    }).then((res) => {
      void this.auditar({ entidadeId: produtoId, acao: 'estoque.ajustado', depois: { tipo: dto.tipo, local: dto.local, quantidade: dto.quantidade }, observacao: `${p.nome} · ${dto.tipo} ${dto.quantidade} em ${dto.local}` }, u);
      return res;
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

  // ==================== SUGESTÃO DE REPOSIÇÃO ====================

  /**
   * Itens ativos que controlam estoque e cujo saldo TOTAL (Loja+Depósito)
   * está no/abaixo do mínimo. Sugere a quantidade a repor para voltar ao
   * mínimo (o ponto de reposição fica para evolução). Não gera compra —
   * é uma sugestão que o operador transforma em Solicitação de Compra.
   */
  async listarReposicao() {
    const controlados = await this.prisma.lojaProduto.findMany({
      where: { ativo: true, controlaEstoque: true, estoqueMinimo: { gt: 0 } },
      include: { categoria: { select: { nome: true } }, saldos: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    const itens = controlados
      .map((p) => {
        const loja = Number(p.saldos.find((s) => s.local === 'LOJA')?.saldoFisico ?? 0);
        const deposito = Number(p.saldos.find((s) => s.local === 'DEPOSITO')?.saldoFisico ?? 0);
        const total = loja + deposito;
        const minimo = Number(p.estoqueMinimo);
        return {
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          unidade: p.unidade,
          categoria: p.categoria?.nome ?? null,
          minimo,
          saldoLoja: loja,
          saldoDeposito: deposito,
          saldoTotal: total,
          sugestaoRepor: Math.max(0, minimo - total),
          // Há saldo no depósito que cobriria a falta na loja? Dica p/ transferir.
          podeTransferirDoDeposito: loja < minimo && deposito > 0,
        };
      })
      .filter((x) => x.saldoTotal <= x.minimo)
      .sort((a, b) => a.saldoTotal - a.minimo - (b.saldoTotal - b.minimo));
    return { total: itens.length, itens };
  }

  // ==================== SYNC OMIE → PDV ====================

  /**
   * Sincroniza o catálogo do Omie (tabela `fato_loja_estoque`) com o PDV da Loja.
   *
   * Regras:
   *   - Produto com saldo > 0 no Omie → vende_pdv=true, exibe_cardapio=true, saldo LOJA atualizado.
   *   - Produto com saldo = 0 no Omie → vende_pdv=false, exibe_cardapio=false.
   *   - Produto novo (sem produto_estoque_id correspondente) → inserido automaticamente.
   *   - Categoria inferida pelo nome (algoritmo inferirCategoria).
   *   - Idempotente: pode ser chamado a qualquer momento sem duplicar dados.
   *
   * Chamado pelo ETL omie_sync.py (via ingest/sync-omie-loja) após atualizar
   * fato_loja_estoque, e também disponível para acionamento manual via endpoint.
   */
  async sincronizarOmie(): Promise<{
    total: number; comEstoque: number; inseridos: number; atualizados: number; desabilitados: number;
  }> {
    this.logger.log('Iniciando sync Omie → Loja PDV');

    // 1. Buscar todos os produtos do Omie
    const omie = await this.prisma.$queryRaw<{
      produto_id: bigint;
      descricao: string;
      codigo: string | null;
      codigo_interno: string | null;
      preco_unitario: string | null;
      custo_medio: string | null;
      saldo: string | null;
    }[]>`
      SELECT produto_id, descricao, codigo, codigo_interno, preco_unitario, custo_medio, saldo
      FROM fato_loja_estoque
      WHERE descricao IS NOT NULL AND TRIM(descricao) <> ''
    `;

    if (omie.length === 0) {
      this.logger.warn('fato_loja_estoque vazia — nada a sincronizar');
      return { total: 0, comEstoque: 0, inseridos: 0, atualizados: 0, desabilitados: 0 };
    }

    // 2. Garantir categorias base
    const categoriasBase = [
      { nome: 'Livros',     descricao: 'Livros e publicações',           cor: '#6366f1', ordem: 10 },
      { nome: 'Apostilas',  descricao: 'Apostilas e materiais didáticos', cor: '#f59e0b', ordem: 20 },
      { nome: 'Camisas',    descricao: 'Camisas e vestuário',            cor: '#10b981', ordem: 30 },
      { nome: 'Bolsas',     descricao: 'Bolsas e mochilas',              cor: '#ec4899', ordem: 40 },
      { nome: 'Acessórios', descricao: 'Acessórios e joias',             cor: '#8b5cf6', ordem: 50 },
      { nome: 'Kits',       descricao: 'Kits e combos',                  cor: '#f97316', ordem: 60 },
      { nome: 'Alimentos',  descricao: 'Alimentos e lanches',            cor: '#84cc16', ordem: 70 },
      { nome: 'Bebidas',    descricao: 'Cafés, chás e bebidas',          cor: '#0ea5e9', ordem: 80 },
      { nome: 'Outros',     descricao: 'Outros produtos',                cor: '#6b7280', ordem: 99 },
    ];
    for (const cat of categoriasBase) {
      await this.prisma.lojaCategoria.upsert({
        where: { nome: cat.nome } as never, // unique by lower(nome) — usa findFirst abaixo
        create: { nome: cat.nome, descricao: cat.descricao, cor: cat.cor, ativo: true, ordem: cat.ordem },
        update: {},
      }).catch(async () => {
        // upsert por lower(nome) não tem suporte direto no Prisma — ignora duplicado
        await this.prisma.lojaCategoria.upsert({
          where: { id: 'noop' } as never,
          create: { nome: cat.nome, descricao: cat.descricao, cor: cat.cor, ativo: true, ordem: cat.ordem },
          update: {},
        }).catch(() => { /* categoria já existe */ });
      });
    }

    // Re-lê categorias como mapa nome→id (case-insensitive)
    const todasCats = await this.prisma.lojaCategoria.findMany({ select: { id: true, nome: true } });
    const catMap = new Map(todasCats.map((c) => [c.nome.toLowerCase(), c.id]));

    // 3. Produtos Omie existentes no catálogo (por produto_estoque_id)
    const existentesLoja = await this.prisma.lojaProduto.findMany({
      where: { produtoEstoqueId: { not: null } },
      select: { id: true, produtoEstoqueId: true },
    });
    const existentesMap = new Map(existentesLoja.map((p) => [p.produtoEstoqueId!.toString(), p.id]));

    let inseridos = 0, atualizados = 0, desabilitados = 0;
    const comEstoque = omie.filter((p) => Number(p.saldo ?? 0) > 0).length;

    for (const p of omie) {
      const omieId = p.produto_id.toString();
      const nome = p.descricao.trim();
      const temEstoque = Number(p.saldo ?? 0) > 0;
      const preco = D(Math.round(Number(p.preco_unitario ?? 0) * 100) / 100);
      const custo = Number(p.custo_medio ?? 0) > 0 ? D(Math.round(Number(p.custo_medio) * 100) / 100) : null;
      const categoriaNome = inferirCategoria(nome);
      const categoriaId = catMap.get(categoriaNome.toLowerCase()) ?? catMap.get('outros') ?? null;
      const saldoFisico = D(Math.max(Number(p.saldo ?? 0), 0));

      const lojaId = existentesMap.get(omieId);

      if (lojaId) {
        // Atualiza produto existente
        await this.prisma.lojaProduto.update({
          where: { id: lojaId },
          data: {
            nome, preco, custo, ativo: true,
            vendePdv: temEstoque, exibeCardapio: temEstoque,
            ...(categoriaId ? { categoria: { connect: { id: categoriaId } } } : {}),
          },
        });
        // Upsert saldo LOJA
        await this.prisma.$executeRaw`
          INSERT INTO loja_estoque_saldos (produto_id, local, saldo_fisico, reservado)
          VALUES (${lojaId}::uuid, 'LOJA', ${saldoFisico}, 0)
          ON CONFLICT (produto_id, local) DO UPDATE
            SET saldo_fisico = GREATEST(EXCLUDED.saldo_fisico, loja_estoque_saldos.reservado),
                atualizado_em = NOW()
        `;
        if (!temEstoque) desabilitados++;
        else atualizados++;
      } else {
        // Insere produto novo
        const novo = await this.prisma.lojaProduto.create({
          data: {
            nome, preco, custo,
            descricao: '',
            unidade: 'un',
            produtoEstoqueId: BigInt(omieId),
            ativo: true,
            vendePdv: temEstoque,
            exibeCardapio: temEstoque,
            precisaPreparacao: false,
            controlaEstoque: true,
            estoqueMinimo: D(0),
            ordem: 0,
            ...(categoriaId ? { categoria: { connect: { id: categoriaId } } } : {}),
          },
        });
        // Cria saldo LOJA e DEPOSITO
        await this.prisma.lojaEstoqueSaldo.createMany({
          data: [
            { produtoId: novo.id, local: 'LOJA', saldoFisico, reservado: D(0) },
            { produtoId: novo.id, local: 'DEPOSITO', saldoFisico: D(0), reservado: D(0) },
          ],
          skipDuplicates: true,
        });
        inseridos++;
      }
    }

    const resultado = { total: omie.length, comEstoque, inseridos, atualizados, desabilitados };
    this.logger.log(`Sync Omie concluído: ${JSON.stringify(resultado)}`);
    return resultado;
  }

  // ==================== BUSCA POR CÓDIGO DE BARRAS ====================

  /**
   * Busca um produto pelo código de barras (EAN/ITF/Code128 etc.).
   * Retorna o produto completo ou lança 404.
   */
  async buscarPorCodigoBarras(codigo: string) {
    const p = await this.prisma.lojaProduto.findFirst({
      where: { codigoBarras: codigo.trim(), ativo: true },
      include: { categoria: true, saldos: true },
    });
    if (!p) throw new NotFoundException({ codigo: 'EAN_NAO_ENCONTRADO', message: `Nenhum produto com código ${codigo}.` });
    return jsonSeguro(this.comEstoque(p));
  }

  /**
   * Atualiza SOMENTE o código de barras de um produto (para o vendedor bipar o
   * produto correto após pesquisa manual). Registra auditoria.
   */
  async atualizarCodigoBarras(id: string, codigoBarras: string | null, u: UsuarioLogado) {
    this.exigeGestor(u);
    const p = await this.prisma.lojaProduto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Produto não encontrado.');

    const codLimpo = codigoBarras?.trim() || null;
    if (codLimpo) {
      // Verifica unicidade (UNIQUE partial index — só quando não nulo)
      const dup = await this.prisma.lojaProduto.findFirst({
        where: { codigoBarras: codLimpo, id: { not: id } },
      });
      if (dup) {
        throw new BadRequestException({
          codigo: 'CODIGO_BARRAS_DUPLICADO',
          message: `Código ${codLimpo} já está em uso pelo produto "${dup.nome}".`,
        });
      }
    }

    await this.prisma.lojaProduto.update({ where: { id }, data: { codigoBarras: codLimpo } });
    void this.auditar({
      entidadeId: id, acao: 'codigo_barras.alterado',
      antes: { codigoBarras: p.codigoBarras }, depois: { codigoBarras: codLimpo },
      observacao: `${p.nome}: ${p.codigoBarras ?? '—'} → ${codLimpo ?? '—'}`,
    }, u);
    return this.obterProduto(id);
  }

  // ==================== EAN ONLINE (Open Food Facts + Cosmos) ====================

  /** Faz uma requisição HTTP GET simples e retorna o corpo como string. */
  private httpGet(url: string, timeoutMs = 4000): Promise<string> {
    return new Promise((resolve, reject) => {
      const modulo = url.startsWith('https') ? https : http;
      const req = modulo.get(url, { headers: { 'User-Agent': 'FebraHub/1.0 (info@aplopes.com)' } }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      });
      req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', reject);
    });
  }

  /**
   * Consulta o EAN em fontes públicas:
   * 1) Open Food Facts (principal — PT-BR)
   * 2) Cosmos (fallback BR)
   * Retorna { nome, marca, descricao } ou null se não encontrado.
   */
  async consultarEanOnline(ean: string): Promise<{ nome: string; marca?: string; descricao?: string } | null> {
    // ---- Open Food Facts ----
    try {
      const raw = await this.httpGet(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`);
      const data = JSON.parse(raw);
      if (data.status === 1 && data.product) {
        const pr = data.product;
        const nome: string = (pr.product_name_pt || pr.product_name || pr.product_name_en || '').trim();
        if (nome) {
          return {
            nome,
            marca: (pr.brands || '').split(',')[0].trim() || undefined,
            descricao: (pr.generic_name_pt || pr.generic_name || '').trim() || undefined,
          };
        }
      }
    } catch { /* não disponível */ }

    // ---- Cosmos (fallback) ----
    try {
      const raw = await this.httpGet(`https://api.cosmos.bluesoft.com.br/gtins/${ean}`, 3000);
      const data = JSON.parse(raw);
      if (data && data.description) {
        return {
          nome: data.description.trim(),
          marca: data.brand?.name?.trim() || undefined,
          descricao: undefined,
        };
      }
    } catch { /* não disponível */ }

    return null;
  }

  /**
   * Varre todos os produtos ATIVOS sem código de barras e tenta encontrar o EAN
   * consultando o nome do produto na internet. Como não há EAN de partida, esta
   * rota faz o inverso: dado um EAN externo, atualiza o produto correspondente.
   *
   * Uso principal: atualização em lote de produtos que já TÊM ean (sku numérico
   * de 8/13 dígitos) mas cujo campo codigo_barras está vazio — tenta confirmar
   * e enriquecer o nome/desc via Open Food Facts.
   *
   * Retorna: { verificados, atualizados, naoEncontrados }
   */
  async enriquecerEanLote(u: UsuarioLogado): Promise<{ verificados: number; atualizados: number; naoEncontrados: number; itens: unknown[] }> {
    this.exigeGestor(u);
    // Produtos ativos cujo SKU parece um EAN (8 ou 13 dígitos numéricos) e ainda
    // não têm codigo_barras preenchido.
    const candidatos = await this.prisma.lojaProduto.findMany({
      where: {
        ativo: true,
        codigoBarras: null,
        sku: { not: null },
      },
      select: { id: true, nome: true, sku: true, descricao: true },
      take: 200,
    });

    const eanPattern = /^\d{8}$|^\d{13}$/;
    const comSku = candidatos.filter((p) => p.sku && eanPattern.test(p.sku.trim()));
    const itens: { id: string; nome: string; ean: string; encontrado: boolean; dadosOnline?: unknown }[] = [];
    let atualizados = 0;
    let naoEncontrados = 0;

    for (const p of comSku) {
      const ean = p.sku!.trim();
      const dados = await this.consultarEanOnline(ean);
      if (dados) {
        // Atualiza codigo_barras e opcionalmente enriquece descricao
        const descAtual = (p.descricao ?? '').trim();
        await this.prisma.lojaProduto.update({
          where: { id: p.id },
          data: {
            codigoBarras: ean,
            ...(descAtual === '' && dados.descricao ? { descricao: dados.descricao } : {}),
          },
        });
        void this.auditar({
          entidadeId: p.id, acao: 'codigo_barras.ean_enriquecido',
          depois: { codigoBarras: ean, fonte: 'online' },
          observacao: `${p.nome} · EAN ${ean} via consulta online`,
        }, u);
        itens.push({ id: p.id, nome: p.nome, ean, encontrado: true, dadosOnline: dados });
        atualizados++;
      } else {
        itens.push({ id: p.id, nome: p.nome, ean, encontrado: false });
        naoEncontrados++;
      }
      // Pequeno delay para não sobrecarregar a API externa
      await new Promise<void>((r) => setTimeout(r, 200));
    }

    return { verificados: comSku.length, atualizados, naoEncontrados, itens };
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
