/**
 * OmieService — Integração bidirecional FebraHub ↔ Omie
 *
 * Responsabilidades:
 *   1. Ler a configuração das variáveis de ambiente (OMIE_APP_KEY, OMIE_APP_SECRET,
 *      OMIE_CONTA_CORRENTE, OMIE_CODIGO_CATEGORIA, OMIE_ID_VENDEDOR)
 *   2. Vincular produtos por codigo_produto_integracao (chave imutável): grava
 *      FH-<id> no Omie e em LojaProduto.codigoIntegracaoOmie (skuOmie = id do Omie)
 *   3. Lançar pedidos da Loja como Pedido de Venda no Omie
 *   4. Listar vendas da Loja com status do lançamento no Omie
 *
 * As credenciais NÃO ficam no banco nem numa tela de configuração: são segredos
 * de aplicação (não expiram) e moram no `.env` do container da API, no mesmo
 * padrão do ETL (`etl/omie_sync.py` usa OMIE_APP_KEY/OMIE_APP_SECRET).
 */
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { LancarOmieDto, ListaVendasQuery } from './omie.dto';

/** Configuração da integração Omie, resolvida do ambiente. */
type OmieCfg = {
  appKey: string | null;
  appSecret: string | null;
  contaCorrente: string | null;
  codigoCategoria: string | null;
  idVendedor: bigint | null;
  ativo: boolean;
};

const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

/** Mapeamento de forma de pagamento FebraHub → código Omie */
const FORMA_OMIE: Record<string, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CARTAO_DEBITO: 'Cartão de Débito',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO: 'Cartão de Crédito',
  FIADO: 'A prazo',
};

/** Erro específico de bloqueio por consumo (rate limit) do Omie. */
class OmieRateLimitError extends Error {
  constructor(public readonly retryEmSegundos: number, msg: string) { super(msg); }
}

/**
 * Omie permite ~60 requisições/min por app_key. Como o vínculo faz até algumas
 * chamadas por produto, sem controle a cota estoura em segundos e o app_key é
 * bloqueado por ~30min ("API bloqueada por consumo indevido"). Este intervalo
 * mínimo entre chamadas mantém a taxa segura (~50/min).
 */
const OMIE_INTERVALO_MS = 1200;

@Injectable()
export class OmieService {
  private readonly logger = new Logger(OmieService.name);
  /** Instante (epoch ms) em que a próxima chamada ao Omie pode ocorrer. */
  private omieProximaChamada = 0;

  constructor(private readonly prisma: PrismaService) {}

  private sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, Math.max(0, ms))); }

  // ==================== CONFIGURAÇÃO (via ambiente) ====================

  /**
   * Lê a configuração da integração das variáveis de ambiente.
   * `ativo` = true quando app_key e app_secret estão presentes; opcionalmente
   * pode-se desligar com OMIE_ATIVO=false mesmo tendo credencial.
   */
  private lerConfigEnv(): OmieCfg {
    const appKey = process.env.OMIE_APP_KEY?.trim() || null;
    const appSecret = process.env.OMIE_APP_SECRET?.trim() || null;
    const desligado = String(process.env.OMIE_ATIVO ?? '').trim().toLowerCase() === 'false';
    const idVendedorRaw = process.env.OMIE_ID_VENDEDOR?.trim();
    const idVendedor = idVendedorRaw && /^\d+$/.test(idVendedorRaw) ? BigInt(idVendedorRaw) : null;
    return {
      appKey,
      appSecret,
      contaCorrente: process.env.OMIE_CONTA_CORRENTE?.trim() || null,
      codigoCategoria: process.env.OMIE_CODIGO_CATEGORIA?.trim() || null,
      idVendedor,
      ativo: !!(appKey && appSecret) && !desligado,
    };
  }

  /** Status da integração para a UI — nunca expõe o secret em texto claro. */
  obterConfig() {
    const cfg = this.lerConfigEnv();
    return jsonSeguro({
      appKey: cfg.appKey ? this.mascarar(cfg.appKey) : null,
      appSecret: cfg.appSecret ? '••••••••' : null,
      contaCorrente: cfg.contaCorrente,
      codigoCategoria: cfg.codigoCategoria,
      idVendedor: cfg.idVendedor,
      ativo: cfg.ativo,
      configurado: !!(cfg.appKey && cfg.appSecret && cfg.ativo),
    });
  }

  /** Mostra só os últimos 4 dígitos da app_key. */
  private mascarar(v: string): string {
    return v.length <= 4 ? '••••' : `••••${v.slice(-4)}`;
  }

  async testarConexao(_u: UsuarioLogado) {
    const cfg = this.obterConfigInterna();
    const resp = await this.chamadaOmie(cfg, 'geral/empresas/', 'ListarEmpresas', { pagina: 1, registros_por_pagina: 1 });
    return { ok: true, empresa: (resp as Record<string, unknown[]>).empresas_cadastro?.[0] ?? null };
  }

  // ==================== VÍNCULO POR CÓDIGO DE INTEGRAÇÃO ====================

  /**
   * Código de integração estável do produto FebraHub → Omie.
   * Usa o ID (UUID) do produto: NUNCA muda mesmo que nome/SKU/descrição mudem.
   * É esse valor que gravamos no `codigo_produto_integracao` do Omie.
   */
  private codigoIntegracao(produtoId: string): string {
    return `FH-${produtoId}`;
  }

  /**
   * Vincula TODOS os produtos da Loja aos produtos do Omie usando o campo
   * `codigo_produto_integracao` (a chave de integração recomendada pela Omie —
   * imutável, diferente do `codigo`/SKU que o usuário pode alterar).
   *
   * Estratégia conforme as BOAS PRÁTICAS da Omie
   * (ajuda.omie.com.br → "Boas Práticas" e "Limites de Consumo da API"):
   *   • Usar LISTAGEM EM LOTE (`ListarProdutos`, 100/pág) para carregar o
   *     catálogo do Omie UMA vez — NUNCA `ConsultarProduto` por produto (o
   *     método de consulta erra quando o registro não existe, e 10 erros no
   *     mesmo IP+AppKey+Método geram bloqueio de 30min / HTTP 425).
   *   • Casar localmente (por `codigo`=SKU, por codigo_produto_integracao ou por
   *     descrição normalizada) para descobrir o `codigo_produto` do Omie.
   *   • Um único write por produto: `AssociarCodIntProduto` (já existe) ou
   *     `IncluirProduto` (não existe), com throttle + backoff (ver chamadaOmie).
   *   • Só grava no nosso banco após o Omie confirmar um `codigo_produto` real.
   *
   * Idempotente: já vinculados (codigoIntegracaoOmie correto + skuOmie) são
   * pulados sem tocar na API.
   */
  async vincularPorIntegracao(_u: UsuarioLogado): Promise<{
    total: number; vinculados: number; associados: number; criados: number; jaVinculados: number; erros: number; bloqueado: boolean;
  }> {
    const cfg = this.obterConfigInterna();
    const produtos = await this.prisma.lojaProduto.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, sku: true, preco: true, unidade: true, codigoBarras: true, skuOmie: true, codigoIntegracaoOmie: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });

    // 1. Carrega o catálogo do Omie UMA vez (listagem em lote, cache local).
    const catalogo = await this.carregarCatalogoOmie(cfg);
    this.logger.log(`Catálogo Omie carregado: ${catalogo.porCodigoProduto.size} produtos`);

    let associados = 0, criados = 0, jaVinculados = 0, erros = 0;
    let bloqueado = false;

    for (const p of produtos) {
      const codInt = this.codigoIntegracao(p.id);
      try {
        // Já vinculado dos dois lados? Nada a fazer (não gasta API).
        if (p.codigoIntegracaoOmie === codInt && p.skuOmie && catalogo.porCodigoProduto.has(p.skuOmie)) {
          jaVinculados++;
          continue;
        }

        // 2. Resolve o codigo_produto do Omie SÓ com o cache local (0 chamadas).
        const codigoProduto = this.acharNoCatalogo(catalogo, p.skuOmie, codInt, p.sku, p.nome);

        if (codigoProduto) {
          // 2a. Existe no Omie → grava o código de integração lá (1 write).
          await this.chamadaOmie(cfg, 'geral/produtos/', 'AssociarCodIntProduto', {
            codigo_produto: Number(codigoProduto),
            codigo_produto_integracao: codInt,
          });
          await this.prisma.lojaProduto.update({
            where: { id: p.id },
            data: { skuOmie: String(codigoProduto), codigoIntegracaoOmie: codInt },
          });
          associados++;
        } else {
          // 2b. Não existe → cria no Omie já com o código de integração (1 write).
          const codigoSku = p.sku?.trim() || codInt; // codigo (SKU) é obrigatório
          const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'IncluirProduto', {
            codigo_produto_integracao: codInt,
            codigo: codigoSku,
            descricao: p.nome,
            unidade: p.unidade?.toUpperCase() || 'UN',
            valor_unitario: Number(p.preco),
            ncm: '00000000',
            ...(p.codigoBarras ? { ean: p.codigoBarras } : {}),
            tipo_item: '04', // 04 = produto acabado
          }) as { codigo_produto?: number };
          const novoCodigoProduto = resp.codigo_produto ? String(resp.codigo_produto) : null;
          if (!novoCodigoProduto) {
            // Sem codigo_produto de volta = inclusão não confirmada: NÃO marca vínculo.
            throw new Error('IncluirProduto não retornou codigo_produto.');
          }
          // Alimenta o cache p/ evitar recriar se aparecer de novo nesta rodada.
          catalogo.porCodigoProduto.set(novoCodigoProduto, { codigoProduto: novoCodigoProduto });
          catalogo.porCodInt.set(codInt, novoCodigoProduto);
          await this.prisma.lojaProduto.update({
            where: { id: p.id },
            data: {
              skuOmie: novoCodigoProduto,
              codigoIntegracaoOmie: codInt,
              ...(!p.sku ? { sku: codigoSku } : {}),
            },
          });
          criados++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Erro ao vincular produto ${p.id} (${codInt}) ao Omie: ${msg}`);
        erros++;
        // Bloqueio por consumo (HTTP 425): não adianta insistir — aborta a rodada.
        if (err instanceof OmieRateLimitError) {
          bloqueado = true;
          this.logger.warn(`Omie bloqueou o app_key (${err.retryEmSegundos}s). Abortando vínculo — rode de novo depois.`);
          break;
        }
      }
    }

    const vinculados = associados + criados;
    const resultado = { total: produtos.length, vinculados, associados, criados, jaVinculados, erros, bloqueado };
    this.logger.log(`Vínculo Omie por codigo_integracao: ${JSON.stringify(resultado)}`);
    return resultado;
  }

  /**
   * Carrega o catálogo completo de produtos do Omie via `ListarProdutos`
   * (listagem em lote, 100/página — método recomendado pela Omie), e monta
   * índices em memória para casar sem gastar mais chamadas:
   *   • porCodigoProduto: codigo_produto → { codigoProduto }
   *   • porCodInt:        codigo_produto_integracao → codigo_produto
   *   • porCodigo:        codigo (SKU) minúsculo → codigo_produto
   *   • porDescricao:     descrição normalizada → codigo_produto
   */
  private async carregarCatalogoOmie(cfg: OmieCfg): Promise<{
    porCodigoProduto: Map<string, { codigoProduto: string }>;
    porCodInt: Map<string, string>;
    porCodigo: Map<string, string>;
    porDescricao: Map<string, string>;
  }> {
    const porCodigoProduto = new Map<string, { codigoProduto: string }>();
    const porCodInt = new Map<string, string>();
    const porCodigo = new Map<string, string>();
    const porDescricao = new Map<string, string>();

    let pagina = 1;
    let totalPaginas = 1;
    do {
      const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'ListarProdutos', {
        pagina, registros_por_pagina: 100, apenas_importado_api: 'N', filtrar_apenas_omiepdv: 'N',
      }) as { total_de_paginas?: number; produto_servico_cadastro?: Array<Record<string, unknown>> };

      totalPaginas = Number(resp.total_de_paginas ?? 1);
      for (const prod of resp.produto_servico_cadastro ?? []) {
        const codigoProduto = prod.codigo_produto != null ? String(prod.codigo_produto) : null;
        if (!codigoProduto) continue;
        porCodigoProduto.set(codigoProduto, { codigoProduto });
        const codInt = (prod.codigo_produto_integracao as string | undefined)?.trim();
        if (codInt) porCodInt.set(codInt, codigoProduto);
        const codigo = (prod.codigo as string | undefined)?.trim();
        if (codigo) porCodigo.set(codigo.toLowerCase(), codigoProduto);
        const descricao = (prod.descricao as string | undefined) ?? '';
        const chaveDesc = this.normalizar(descricao);
        if (chaveDesc && !porDescricao.has(chaveDesc)) porDescricao.set(chaveDesc, codigoProduto);
      }
      pagina++;
    } while (pagina <= totalPaginas);

    return { porCodigoProduto, porCodInt, porCodigo, porDescricao };
  }

  /**
   * Acha o codigo_produto do Omie SÓ no cache local (sem chamada à API),
   * na ordem: skuOmie conhecido → codigo_produto_integracao → codigo (SKU) →
   * descrição normalizada. Retorna null se não existe no catálogo.
   */
  private acharNoCatalogo(
    catalogo: { porCodigoProduto: Map<string, { codigoProduto: string }>; porCodInt: Map<string, string>; porCodigo: Map<string, string>; porDescricao: Map<string, string> },
    skuOmie: string | null,
    codInt: string,
    sku: string | null,
    nome: string,
  ): string | null {
    if (skuOmie && catalogo.porCodigoProduto.has(skuOmie)) return skuOmie;
    if (catalogo.porCodInt.has(codInt)) return catalogo.porCodInt.get(codInt)!;
    const skuKey = sku?.trim().toLowerCase();
    if (skuKey && catalogo.porCodigo.has(skuKey)) return catalogo.porCodigo.get(skuKey)!;
    const descKey = this.normalizar(nome);
    if (descKey && catalogo.porDescricao.has(descKey)) return catalogo.porDescricao.get(descKey)!;
    return null;
  }

  /** Normaliza texto p/ casar descrições: sem acento, minúsculo, espaços colapsados. */
  private normalizar(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ==================== LISTAR VENDAS ====================

  async listarVendas(q: ListaVendasQuery) {
    const pagina = Math.max(1, Number(q.pagina ?? 1));
    const porPagina = Math.min(100, Math.max(10, Number(q.porPagina ?? 30)));
    const skip = (pagina - 1) * porPagina;

    const where: Prisma.LojaPedidoWhereInput = {
      status: { notIn: ['AGUARDANDO_PAGAMENTO', 'EXPIRADO'] },
    };

    if (q.busca) {
      where.OR = [
        { clienteNome: { contains: q.busca, mode: 'insensitive' } },
        { clienteTel: { contains: q.busca, mode: 'insensitive' } },
        { operadorNome: { contains: q.busca, mode: 'insensitive' } },
      ];
    }
    if (q.status) where.status = q.status as string;
    if (q.dataInicio || q.dataFim) {
      where.criadoEm = {};
      if (q.dataInicio) (where.criadoEm as Prisma.DateTimeFilter).gte = new Date(q.dataInicio);
      if (q.dataFim) (where.criadoEm as Prisma.DateTimeFilter).lte = new Date(q.dataFim + 'T23:59:59Z');
    }

    // Filtro por status Omie
    if (q.statusOmie === 'pendente') {
      where.omieLancamento = null;
    } else if (q.statusOmie && q.statusOmie !== 'todos') {
      where.omieLancamento = { status: q.statusOmie };
    }

    const [total, pedidos] = await Promise.all([
      this.prisma.lojaPedido.count({ where }),
      this.prisma.lojaPedido.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: porPagina,
        include: {
          operacao: { select: { nome: true, slug: true } },
          pagamentos: { select: { forma: true, valor: true, status: true } },
          omieLancamento: { select: { status: true, omieNumero: true, omiePedidoId: true, lancadoEm: true, erro: true } },
          itens: {
            select: {
              descricao: true, quantidade: true, precoUnit: true, total: true,
              produto: { select: { sku: true, skuOmie: true, nome: true } },
            },
          },
        },
      }),
    ]);

    return {
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina),
      itens: jsonSeguro(pedidos),
    };
  }

  // ==================== LANÇAR NO OMIE ====================

  async lancarPedido(pedidoId: string, u: UsuarioLogado) {
    return this.lancarPedidos([pedidoId], u);
  }

  async lancarPedidos(pedidoIds: string[], u: UsuarioLogado): Promise<{ lancados: number; erros: number; resultados: Record<string, unknown>[] }> {
    const cfg = this.obterConfigInterna();
    if (!cfg.ativo) throw new BadRequestException('Integração Omie desativada (OMIE_ATIVO=false). Ajuste o ambiente da API.');

    const pedidos = await this.prisma.lojaPedido.findMany({
      where: {
        id: { in: pedidoIds },
        status: { notIn: ['AGUARDANDO_PAGAMENTO', 'CANCELADO', 'EXPIRADO'] },
      },
      include: {
        itens: {
          include: {
            produto: { select: { id: true, nome: true, sku: true, skuOmie: true, preco: true, unidade: true } },
          },
        },
        pagamentos: { where: { status: 'PAGO' } },
        omieLancamento: true,
      },
    });

    const resultados: Record<string, unknown>[] = [];
    let lancados = 0, erros = 0;

    for (const pedido of pedidos) {
      // Não relançar se já lançado com sucesso
      if (pedido.omieLancamento?.status === 'lancado') {
        resultados.push({ pedidoId: pedido.id, status: 'ignorado', motivo: 'Já lançado no Omie' });
        continue;
      }

      try {
        // Garantir SKU dos produtos
        for (const item of pedido.itens) {
          if (!item.produto.skuOmie) {
            await this.sincronizarSkuProduto(cfg, item.produto.id, item.produto.nome, item.produto.sku, Number(item.produto.preco), item.produto.unidade);
          }
        }

        // Re-buscar produtos com skuOmie atualizado
        const itensAtualizados = await this.prisma.lojaPedidoItem.findMany({
          where: { pedidoId: pedido.id },
          include: { produto: { select: { id: true, skuOmie: true, nome: true, unidade: true } } },
        });

        const dataVenda = (pedido.confirmadoEm ?? pedido.criadoEm).toISOString().split('T')[0];
        const [dia, mes, ano] = dataVenda.split('-').reverse();
        const dataFormatada = `${dia}/${mes}/${ano}`;

        // Monta itens do pedido para o Omie
        const itensPedido = itensAtualizados.map((item, idx) => ({
          ide: { nItem: idx + 1 },
          inf_adic: { dados_adic_item: item.descricao || item.produto.nome },
          produto: {
            codigo: item.produto.skuOmie || item.produto.nome,
            descricao: item.descricao || item.produto.nome,
            cfop: '5102',
            ncm: '00000000',
            unidade: item.produto.unidade?.toUpperCase() || 'UN',
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.precoUnit),
            valor_total: Number(item.total),
          },
        }));

        // Forma de pagamento principal
        const pgPrincipal = pedido.pagamentos[0];
        const formaPagto = pgPrincipal ? (FORMA_OMIE[pgPrincipal.forma] ?? pgPrincipal.forma) : 'Dinheiro';

        const payload = {
          cabecalho: {
            codigo_cliente: 0, // cliente avulso
            codigo_pedido_integracao: pedido.id,
            data_previsao: dataFormatada,
            etapa: '20', // Pedido de Venda Confirmado
            qtde_parcelas: 1,
          },
          informacoes_adicionais: {
            codigo_categoria: cfg.codigoCategoria || '',
            codigo_conta_corrente: cfg.contaCorrente ? Number(cfg.contaCorrente) : undefined,
            consumidor_final: 'S',
            enviar_email: 'N',
            obs_venda: `Venda FebraHub #${pedido.numero} | ${pedido.canal} | ${pedido.clienteNome || 'Cliente avulso'}`,
          },
          lista_parcelas: [{
            percentual: 100,
            valor: Number(pedido.total),
            data_vencimento: dataFormatada,
            meio_pagamento: formaPagto,
          }],
          det: itensPedido,
        };

        // Upsert lançamento (cria ou atualiza)
        const lancExist = pedido.omieLancamento;

        let lancId: string;
        if (lancExist) {
          lancId = lancExist.id;
          await this.prisma.omieLancamento.update({
            where: { id: lancId },
            data: { status: 'pendente', erro: null, payloadEnviado: payload as unknown as Prisma.InputJsonValue, usuarioId: u.id, usuarioNome: u.nome },
          });
        } else {
          const lanc = await this.prisma.omieLancamento.create({
            data: {
              pedidoId: pedido.id,
              status: 'pendente',
              payloadEnviado: payload as unknown as Prisma.InputJsonValue,
              usuarioId: u.id,
              usuarioNome: u.nome,
            },
          });
          lancId = lanc.id;
        }

        // Chamar Omie
        const resp = await this.chamadaOmie(cfg, 'produtos/pedido/', 'IncluirPedido', payload) as {
          codigo_pedido?: number;
          codigo_pedido_integracao?: string;
          numero_pedido?: string;
        };

        await this.prisma.omieLancamento.update({
          where: { id: lancId },
          data: {
            status: 'lancado',
            omiePedidoId: resp.codigo_pedido ? BigInt(resp.codigo_pedido) : null,
            omieNumero: resp.numero_pedido ?? resp.codigo_pedido_integracao ?? null,
            lancadoEm: new Date(),
            respostaOmie: resp as unknown as Prisma.InputJsonValue,
          },
        });

        lancados++;
        resultados.push({ pedidoId: pedido.id, status: 'lancado', omieNumero: resp.numero_pedido });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        erros++;

        await this.prisma.omieLancamento.upsert({
          where: { pedidoId: pedido.id },
          create: { pedidoId: pedido.id, status: 'erro', erro: msg, usuarioId: u.id, usuarioNome: u.nome },
          update: { status: 'erro', erro: msg, usuarioId: u.id, usuarioNome: u.nome },
        });

        resultados.push({ pedidoId: pedido.id, status: 'erro', erro: msg });
        this.logger.warn(`Erro ao lançar pedido ${pedido.id} no Omie: ${msg}`);
      }
    }

    return { lancados, erros, resultados };
  }

  async lancarFiltrados(dto: LancarOmieDto, u: UsuarioLogado) {
    if (dto.pedidoIds?.length) {
      return this.lancarPedidos(dto.pedidoIds, u);
    }

    // Buscar todos os pedidos elegíveis não lançados
    const where: Prisma.LojaPedidoWhereInput = {
      status: { notIn: ['AGUARDANDO_PAGAMENTO', 'CANCELADO', 'EXPIRADO'] },
      omieLancamento: null, // Ainda não lançados
    };
    if (dto.dataInicio) (where.criadoEm as Prisma.DateTimeFilter) = { ...(where.criadoEm as object), gte: new Date(dto.dataInicio) };
    if (dto.dataFim) (where.criadoEm as Prisma.DateTimeFilter) = { ...(where.criadoEm as object), lte: new Date(dto.dataFim + 'T23:59:59Z') };

    const pedidos = await this.prisma.lojaPedido.findMany({
      where,
      select: { id: true },
      orderBy: { criadoEm: 'asc' },
      take: 200, // limite de segurança
    });

    return this.lancarPedidos(pedidos.map((p) => p.id), u);
  }

  // ==================== HELPERS INTERNOS ====================

  private obterConfigInterna(): OmieCfg {
    const cfg = this.lerConfigEnv();
    if (!cfg.appKey || !cfg.appSecret) {
      throw new BadRequestException(
        'Integração Omie não configurada. Defina OMIE_APP_KEY e OMIE_APP_SECRET no ambiente da API.',
      );
    }
    return cfg;
  }

  /**
   * Garante, na hora de lançar um pedido, que o produto está vinculado ao Omie
   * pela chave de integração (codigo_produto_integracao). Mesma estratégia do
   * vínculo em lote: acha por skuOmie/codigo_integracao/codigo, ou cria no Omie.
   * Ao final, `skuOmie` (codigo_produto) e `codigoIntegracaoOmie` ficam gravados.
   */
  private async sincronizarSkuProduto(cfg: OmieCfg, prodId: string, nome: string, sku: string | null, preco: number, unidade: string | null) {
    const codInt = this.codigoIntegracao(prodId);
    // Caso 1 produto (lançamento): consulta pontual é aceitável (1 chamada),
    // ao contrário do lote, que usa listagem em lote p/ evitar bloqueio.
    const codigoProduto = await this.consultarCodigoProdutoOmie(cfg, codInt, sku);

    if (codigoProduto) {
      await this.chamadaOmie(cfg, 'geral/produtos/', 'AssociarCodIntProduto', {
        codigo_produto: Number(codigoProduto),
        codigo_produto_integracao: codInt,
      });
      await this.prisma.lojaProduto.update({
        where: { id: prodId },
        data: { skuOmie: String(codigoProduto), codigoIntegracaoOmie: codInt },
      });
      return;
    }

    const codigoSku = sku?.trim() || codInt;
    const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'IncluirProduto', {
      codigo_produto_integracao: codInt,
      codigo: codigoSku,
      descricao: nome,
      unidade: unidade?.toUpperCase() || 'UN',
      valor_unitario: preco,
      ncm: '00000000',
      tipo_item: '04',
    }) as { codigo_produto?: number };
    if (!resp.codigo_produto) throw new Error('IncluirProduto não retornou codigo_produto.');
    await this.prisma.lojaProduto.update({
      where: { id: prodId },
      data: {
        skuOmie: String(resp.codigo_produto),
        codigoIntegracaoOmie: codInt,
        ...(!sku ? { sku: codigoSku } : {}),
      },
    });
  }

  /**
   * Consulta PONTUAL do codigo_produto de UM produto (caminho de lançamento):
   * tenta por codigo_produto_integracao, depois por `codigo` (SKU). Distingue
   * "não cadastrado" (→ null) de erro real (rate limit etc. → re-lança), para
   * NÃO tratar um bloqueio como "produto inexistente" e criar duplicado.
   */
  private async consultarCodigoProdutoOmie(cfg: OmieCfg, codInt: string, sku: string | null): Promise<string | null> {
    const chaves: Record<string, unknown>[] = [{ codigo_produto_integracao: codInt }];
    if (sku?.trim()) chaves.push({ codigo: sku.trim() });
    for (const chave of chaves) {
      try {
        const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'ConsultarProduto', chave) as { codigo_produto?: number };
        if (resp?.codigo_produto) return String(resp.codigo_produto);
      } catch (err) {
        if (err instanceof OmieRateLimitError) throw err; // bloqueio: propaga
        if (this.ehNaoCadastrado(err)) continue;          // não existe p/ essa chave: tenta a próxima
        throw err;                                         // erro real: propaga
      }
    }
    return null;
  }

  /** Fault do Omie que significa "produto não existe para essa chave". */
  private ehNaoCadastrado(err: unknown): boolean {
    const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
    return m.includes('não cadastrado') || m.includes('nao cadastrado') || m.includes('não encontrado') || m.includes('nao encontrado');
  }

  /**
   * Chamada genérica à API Omie (JSON, POST) com CONTROLE DE CONSUMO
   * (conforme "Limites de Consumo da API do Omie"):
   *   • Throttle: intervalo mínimo entre chamadas (fila global no serviço),
   *     mantendo a taxa bem abaixo dos 240/min por IP+AppKey+Método.
   *   • Backoff/retry em rate limit transitório ("Too many requests" / HTTP 429).
   *   • HTTP 425 "API bloqueada por consumo indevido" → OmieRateLimitError
   *     (bloqueio de ~30min; não adianta reintentar na hora).
   * Endpoint: https://app.omie.com.br/api/v1/<path>
   */
  private async chamadaOmie(
    cfg: { appKey: string | null; appSecret: string | null },
    path: string,
    call: string,
    params: Record<string, unknown>,
    tentativa = 0,
  ): Promise<unknown> {
    // Throttle global: respeita o intervalo mínimo entre chamadas ao Omie.
    const espera = this.omieProximaChamada - Date.now();
    if (espera > 0) await this.sleep(espera);
    this.omieProximaChamada = Date.now() + OMIE_INTERVALO_MS;

    const url = `https://app.omie.com.br/api/v1/${path}`;
    const body = JSON.stringify({ call, app_key: cfg.appKey, app_secret: cfg.appSecret, param: [params] });

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // HTTP 425 = bloqueio por consumo indevido (30min). 429 = too many requests.
    if (resp.status === 425 || resp.status === 429) {
      const texto = await resp.text().catch(() => '');
      const seg = this.segundosDoBloqueio(texto);
      if (resp.status === 429 && tentativa < 3) {
        // Transitório: espera e reintenta (backoff exponencial, teto 30s).
        await this.sleep(Math.min(30_000, seg ? seg * 1000 : 2_000 * 2 ** tentativa));
        return this.chamadaOmie(cfg, path, call, params, tentativa + 1);
      }
      throw new OmieRateLimitError(seg ?? 1800, `Omie bloqueou o consumo (HTTP ${resp.status}). ${texto.slice(0, 200)}`);
    }

    const data = await resp.json().catch(() => ({})) as Record<string, unknown>;

    // Omie devolve erros no corpo (faultstring / faultcode) mesmo com HTTP 200/500.
    if (data.faultstring || data.faultcode || data.faultCode) {
      const msg = String(data.faultstring ?? data.faultcode ?? data.faultCode ?? 'Erro Omie desconhecido');
      const seg = this.segundosDoBloqueio(msg);
      if (/bloquead[ao] por consumo|too many requests|consumo indevido/i.test(msg)) {
        throw new OmieRateLimitError(seg ?? 1800, msg);
      }
      throw new Error(msg);
    }
    return data;
  }

  /** Extrai "Tente novamente em N segundos" de uma mensagem de bloqueio do Omie. */
  private segundosDoBloqueio(msg: string): number | null {
    const m = /(\d+)\s*segundos?/i.exec(msg);
    return m ? Number(m[1]) : null;
  }
}
