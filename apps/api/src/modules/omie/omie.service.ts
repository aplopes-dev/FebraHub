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

@Injectable()
export class OmieService {
  private readonly logger = new Logger(OmieService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   * Para cada produto ativo, de forma idempotente:
   *   1. Calcula o código de integração `FH-<id>`.
   *   2. Localiza o produto no Omie (nesta ordem):
   *        a. pelo skuOmie já conhecido (codigo_produto);
   *        b. pelo próprio codigo_produto_integracao (já vinculado antes);
   *        c. pelo `codigo` (= nosso SKU), se houver.
   *   3. Se achou: grava o codigo_produto_integracao no Omie
   *      (AssociarCodIntProduto) e guarda skuOmie + codigoIntegracaoOmie aqui.
   *   4. Se não achou: cria o produto no Omie (IncluirProduto) já com o
   *      codigo_produto_integracao definido, e guarda o codigo_produto retornado.
   *
   * Substitui a antiga sincronização por SKU (`codigo`): o vínculo agora é
   * sempre por `codigo_produto_integracao`.
   */
  async vincularPorIntegracao(_u: UsuarioLogado): Promise<{
    total: number; vinculados: number; associados: number; criados: number; jaVinculados: number; erros: number;
  }> {
    const cfg = this.obterConfigInterna();
    const produtos = await this.prisma.lojaProduto.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, sku: true, preco: true, unidade: true, codigoBarras: true, skuOmie: true, codigoIntegracaoOmie: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });

    let associados = 0, criados = 0, jaVinculados = 0, erros = 0;

    for (const p of produtos) {
      const codInt = this.codigoIntegracao(p.id);
      try {
        // Já vinculado com o código correto dos dois lados? Nada a fazer.
        if (p.codigoIntegracaoOmie === codInt && p.skuOmie) {
          jaVinculados++;
          continue;
        }

        // 1. Resolve o produto do lado do Omie (codigo_produto).
        const codigoProduto = await this.resolverCodigoProdutoOmie(cfg, p.skuOmie, codInt, p.sku);

        if (codigoProduto) {
          // 2a. Já existe no Omie → grava o código de integração lá (associa).
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
          // 2b. Não existe → cria no Omie já com o código de integração.
          const codigoSku = p.sku?.trim() || codInt; // codigo (SKU) é obrigatório; usa o próprio codInt se não houver
          const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'IncluirProduto', {
            codigo_produto_integracao: codInt,
            codigo: codigoSku,
            descricao: p.nome,
            unidade: p.unidade?.toUpperCase() || 'UN',
            valor_unitario: Number(p.preco),
            ncm: '00000000',
            ...(p.codigoBarras ? { ean: p.codigoBarras } : {}),
            tipo_item: '04', // 04 = produto acabado
          }) as { codigo_produto?: number; codigo_produto_integracao?: string };
          const novoCodigoProduto = resp.codigo_produto ? String(resp.codigo_produto) : null;
          await this.prisma.lojaProduto.update({
            where: { id: p.id },
            data: {
              codigoIntegracaoOmie: codInt,
              ...(novoCodigoProduto ? { skuOmie: novoCodigoProduto } : {}),
              ...(!p.sku ? { sku: codigoSku } : {}),
            },
          });
          criados++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Erro ao vincular produto ${p.id} (${codInt}) ao Omie: ${msg}`);
        erros++;
      }
    }

    const vinculados = associados + criados;
    const resultado = { total: produtos.length, vinculados, associados, criados, jaVinculados, erros };
    this.logger.log(`Vínculo Omie por codigo_integracao: ${JSON.stringify(resultado)}`);
    return resultado;
  }

  /**
   * Descobre o `codigo_produto` (ID interno do Omie) de um produto, tentando,
   * em ordem: skuOmie conhecido → codigo_produto_integracao → codigo (SKU).
   * Retorna null se o produto não existe no Omie.
   */
  private async resolverCodigoProdutoOmie(
    cfg: OmieCfg,
    skuOmie: string | null,
    codInt: string,
    sku: string | null,
  ): Promise<string | null> {
    const chaves: Record<string, unknown>[] = [];
    if (skuOmie) chaves.push({ codigo_produto: Number(skuOmie) });
    chaves.push({ codigo_produto_integracao: codInt });
    if (sku?.trim()) chaves.push({ codigo: sku.trim() });

    for (const chave of chaves) {
      try {
        const resp = await this.chamadaOmie(cfg, 'geral/produtos/', 'ConsultarProduto', chave) as { codigo_produto?: number; codigo_interno?: string; nCodProd?: number };
        const id = resp?.codigo_produto ?? resp?.nCodProd ?? (resp?.codigo_interno ? Number(resp.codigo_interno) : undefined);
        if (id) return String(id);
      } catch { /* essa chave não achou — tenta a próxima */ }
    }
    return null;
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
    const codigoProduto = await this.resolverCodigoProdutoOmie(cfg, null, codInt, sku);

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
    await this.prisma.lojaProduto.update({
      where: { id: prodId },
      data: {
        codigoIntegracaoOmie: codInt,
        ...(resp.codigo_produto ? { skuOmie: String(resp.codigo_produto) } : {}),
        ...(!sku ? { sku: codigoSku } : {}),
      },
    });
  }

  /**
   * Chamada genérica à API Omie (JSON, POST).
   * Endpoint: https://app.omie.com.br/api/v1/<path>
   */
  private async chamadaOmie(
    cfg: { appKey: string | null; appSecret: string | null },
    path: string,
    call: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `https://app.omie.com.br/api/v1/${path}`;
    const body = JSON.stringify({
      call,
      app_key: cfg.appKey,
      app_secret: cfg.appSecret,
      param: [params],
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await resp.json() as Record<string, unknown>;

    // Omie retorna erros com faultstring ou campo faultCode
    if (data.faultstring || data.faultCode) {
      throw new Error(String(data.faultstring ?? data.faultCode ?? 'Erro Omie desconhecido'));
    }
    return data;
  }
}
