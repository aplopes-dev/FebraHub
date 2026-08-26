/**
 * Sympla — serviço de sincronização e consulta.
 *
 * Fluxo de sync:
 *  1. listarEventos() → upsert em sympla_eventos
 *  2. sincronizarEvento(id) → upsert orders + participantes do evento
 *  3. vincularCrm() — para cada order/participante, tenta encontrar
 *     a Pessoa correspondente no CRM (por CPF > email > telefone)
 *
 * Idempotente: pode rodar N vezes sem duplicar.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SymplaClient } from './sympla.client';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';

@Injectable()
export class SymplaService {
  private readonly logger = new Logger(SymplaService.name);

  private get client(): SymplaClient {
    const token = process.env.SYMPLA_TOKEN;
    if (!token) throw new Error('SYMPLA_TOKEN não configurado no ambiente');
    return new SymplaClient(token);
  }

  constructor(private readonly prisma: PrismaService) {}

  /* ─── helpers ─── */

  private async criarLogSync(tipo: string, referenciaId?: string, usuarioId?: string) {
    return this.prisma.$queryRaw<Array<{ id: bigint }>>`
      INSERT INTO sympla_sync_log (tipo, referencia_id, status, usuario_id)
      VALUES (${tipo}, ${referenciaId ?? null}, 'iniciado', ${usuarioId ? usuarioId : null}::uuid)
      RETURNING id
    `.then((r) => Number(r[0]?.id ?? 0));
  }

  private async fecharLog(logId: number, stats: { total?: number; novos?: number; atualizados?: number; erros?: number; erro?: string }) {
    await this.prisma.$executeRaw`
      UPDATE sympla_sync_log
      SET status = ${stats.erro ? 'erro' : 'concluido'},
          total_registros = ${stats.total ?? 0},
          novos = ${stats.novos ?? 0},
          atualizados = ${stats.atualizados ?? 0},
          erros = ${stats.erros ?? 0},
          erro_mensagem = ${stats.erro ?? null},
          concluido_em = now()
      WHERE id = ${logId}
    `;
  }

  /* ─── CONSULTA ─── */

  async listarEventos(pagina = 1, limite = 20) {
    const [eventos, total] = await Promise.all([
      this.prisma.$queryRaw<Array<{
        id: bigint; nome: string; data_inicio: Date | null; cidade: string | null;
        estado: string | null; imagem_url: string | null; total_pedidos: number | null;
        total_receita: string | null; total_liquido: string | null;
        cancelado: boolean; sincronizado_em: Date | null;
      }>>`
        SELECT id, nome, data_inicio, cidade, estado, imagem_url,
               total_pedidos, total_receita, total_liquido,
               cancelado, sincronizado_em
        FROM sympla_eventos
        ORDER BY data_inicio DESC
        LIMIT ${limite} OFFSET ${(pagina - 1) * limite}
      `,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint as count FROM sympla_eventos`,
    ]);
    return {
      dados: eventos.map((e) => ({ ...e, id: Number(e.id), totalPedidos: e.total_pedidos, totalReceita: Number(e.total_receita ?? 0), totalLiquido: Number(e.total_liquido ?? 0) })),
      total: Number(total[0]?.count ?? 0),
      pagina,
      limite,
    };
  }

  async obterEvento(id: number) {
    const [evento] = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM sympla_eventos WHERE id = ${id}
    `;
    if (!evento) throw new NotFoundException(`Evento Sympla #${id} não encontrado`);
    return evento;
  }

  async listarOrders(eventoId: number, pagina = 1, limite = 50, status?: string) {
    const filtroStatus = status ? `AND o.status = ${status}` : '';
    const [orders, total] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT o.id, o.evento_id, o.order_date, o.approved_date, o.status,
               o.transaction_type, o.total_sale_price, o.total_net_value,
               o.buyer_first_name, o.buyer_last_name, o.buyer_email, o.buyer_cpf,
               o.utm_source, o.utm_campaign, o.crm_cliente_id, o.com_oportunidade_id,
               c.nome as crm_nome
        FROM sympla_orders o
        LEFT JOIN crm_clientes c ON c.id = o.crm_cliente_id
        WHERE o.evento_id = ${eventoId}
        ${status ? `AND o.status = '${status}'` : ''}
        ORDER BY o.order_date DESC
        LIMIT ${limite} OFFSET ${(pagina - 1) * limite}
      `,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint as count FROM sympla_orders WHERE evento_id = ${eventoId}
      `,
    ]);
    return { dados: orders, total: Number(total[0]?.count ?? 0), pagina, limite };
  }

  async resumoEventos() {
    const [stats] = await this.prisma.$queryRaw<Array<{
      total_eventos: bigint; total_orders: bigint;
      receita_total: string; liquido_total: string;
      com_crm: bigint; sem_crm: bigint;
    }>>`
      SELECT
        (SELECT COUNT(*)::bigint FROM sympla_eventos WHERE cancelado = false) as total_eventos,
        (SELECT COUNT(*)::bigint FROM sympla_orders WHERE status = 'A') as total_orders,
        (SELECT COALESCE(SUM(total_sale_price), 0)::text FROM sympla_orders WHERE status = 'A') as receita_total,
        (SELECT COALESCE(SUM(total_net_value), 0)::text FROM sympla_orders WHERE status = 'A') as liquido_total,
        (SELECT COUNT(*)::bigint FROM sympla_orders WHERE crm_cliente_id IS NOT NULL) as com_crm,
        (SELECT COUNT(*)::bigint FROM sympla_orders WHERE crm_cliente_id IS NULL AND status = 'A') as sem_crm
    `;
    return {
      totalEventos: Number(stats.total_eventos),
      totalOrders: Number(stats.total_orders),
      receitaTotal: Number(stats.receita_total),
      liquidoTotal: Number(stats.liquido_total),
      comCrm: Number(stats.com_crm),
      semCrm: Number(stats.sem_crm),
    };
  }

  async ultimoSync() {
    const [log] = await this.prisma.$queryRaw<Array<{
      tipo: string; status: string; total_registros: number;
      novos: number; atualizados: number; erros: number; concluido_em: Date | null; iniciado_em: Date;
    }>>`
      SELECT tipo, status, total_registros, novos, atualizados, erros, concluido_em, iniciado_em
      FROM sympla_sync_log
      ORDER BY iniciado_em DESC
      LIMIT 1
    `;
    return log ?? null;
  }

  /* ─── SINCRONIZAÇÃO ─── */

  /** Sincroniza a lista de eventos da conta Sympla. */
  async sincronizarEventos(u?: UsuarioLogado): Promise<{ novos: number; atualizados: number; total: number }> {
    const logId = await this.criarLogSync('eventos', undefined, u?.id);
    let novos = 0;
    let atualizados = 0;
    let total = 0;
    try {
      let pagina = 1;
      let temMais = true;
      while (temMais) {
        const resp = await this.client.listarEventos(pagina, 50);
        total += resp.data.length;
        for (const ev of resp.data) {
          const existe = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
            SELECT id FROM sympla_eventos WHERE id = ${ev.id}
          `;
          if (existe.length === 0) {
            await this.prisma.$executeRaw`
              INSERT INTO sympla_eventos
                (id, nome, data_inicio, data_fim, local_nome, cidade, estado, imagem_url, url_sympla, publicado, cancelado, payload_raw, sincronizado_em)
              VALUES (
                ${ev.id}, ${ev.name},
                ${ev.start_date ? new Date(ev.start_date) : null},
                ${ev.end_date ? new Date(ev.end_date) : null},
                ${ev.address?.name ?? null}, ${ev.address?.city ?? null}, ${ev.address?.state ?? null},
                ${ev.image ?? null}, ${ev.url ?? null},
                ${ev.published === 1}, ${ev.cancelled === 1},
                ${JSON.stringify(ev)}::jsonb, now()
              )
              ON CONFLICT (id) DO NOTHING
            `;
            novos++;
          } else {
            await this.prisma.$executeRaw`
              UPDATE sympla_eventos SET
                nome = ${ev.name},
                data_inicio = ${ev.start_date ? new Date(ev.start_date) : null},
                data_fim = ${ev.end_date ? new Date(ev.end_date) : null},
                publicado = ${ev.published === 1},
                cancelado = ${ev.cancelled === 1},
                imagem_url = ${ev.image ?? null},
                sincronizado_em = now(),
                atualizado_em = now()
              WHERE id = ${ev.id}
            `;
            atualizados++;
          }
        }
        temMais = resp.pagination.has_next;
        pagina++;
      }
      await this.fecharLog(logId, { total, novos, atualizados });
      return { novos, atualizados, total };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.fecharLog(logId, { total, novos, atualizados, erro: msg });
      throw err;
    }
  }

  /** Sincroniza orders e participantes de um evento específico. */
  async sincronizarEvento(eventoId: number, u?: UsuarioLogado): Promise<{ orders: number; participantes: number }> {
    const logId = await this.criarLogSync('orders_evento', String(eventoId), u?.id);
    let totalOrders = 0;
    let totalParticipantes = 0;
    try {
      // 1. Buscar todas as orders do evento
      let pagina = 1;
      let temMais = true;
      while (temMais) {
        const resp = await this.client.listarOrders(eventoId, pagina, 100);
        for (const order of resp.data) {
          totalOrders++;
          // CPF via invoice_info
          const cpf = order.invoice_info?.doc_number?.replace(/\D/g, '') || null;
          const buyerNome = `${order.buyer_first_name} ${order.buyer_last_name}`.trim();
          await this.prisma.$executeRaw`
            INSERT INTO sympla_orders (
              id, evento_id, order_date, approved_date, updated_date,
              status, transaction_type, total_sale_price, total_net_value,
              buyer_first_name, buyer_last_name, buyer_email, buyer_cpf,
              utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer,
              payload_raw, sincronizado_em
            ) VALUES (
              ${order.id}, ${eventoId},
              ${order.order_date ? new Date(order.order_date) : null},
              ${order.approved_date ? new Date(order.approved_date) : null},
              ${order.updated_date ? new Date(order.updated_date) : null},
              ${order.order_status}, ${order.transaction_type},
              ${order.order_total_sale_price}, ${order.order_total_net_value},
              ${order.buyer_first_name}, ${order.buyer_last_name},
              ${order.buyer_email?.toLowerCase() ?? null}, ${cpf},
              ${order.utm?.utm_source || null}, ${order.utm?.utm_medium || null},
              ${order.utm?.utm_campaign || null}, ${order.utm?.utm_term || null},
              ${order.utm?.utm_content || null}, ${order.utm?.referrer || null},
              ${JSON.stringify(order)}::jsonb, now()
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              total_sale_price = EXCLUDED.total_sale_price,
              total_net_value = EXCLUDED.total_net_value,
              updated_date = EXCLUDED.updated_date,
              sincronizado_em = now(),
              atualizado_em = now()
          `;

          // 2. Buscar participantes desta order
          try {
            const partsResp = await this.client.listarParticipantes(eventoId, order.id, 1);
            for (const part of partsResp.data) {
              totalParticipantes++;
              const campos = SymplaClient.extrairCampos(part.custom_form ?? []);
              const checkinFeito = part.checkin?.some((c) => c.check_in) ?? false;
              const checkinDate = part.checkin?.find((c) => c.check_in_date)?.check_in_date ?? null;
              await this.prisma.$executeRaw`
                INSERT INTO sympla_participantes (
                  id, order_id, evento_id, ticket_number, ticket_name, ticket_price,
                  first_name, last_name, email, telefone, cpf,
                  checkin, checkin_date, custom_form, payload_raw, sincronizado_em
                ) VALUES (
                  ${part.id}, ${order.id}, ${eventoId},
                  ${part.ticket_number ?? null}, ${part.ticket_name ?? null}, ${part.ticket_sale_price ?? 0},
                  ${part.first_name}, ${part.last_name},
                  ${part.email?.toLowerCase() ?? null},
                  ${campos.telefone ?? null}, ${campos.cpf ?? null},
                  ${checkinFeito}, ${checkinDate ? new Date(checkinDate) : null},
                  ${JSON.stringify(part.custom_form ?? [])}::jsonb,
                  ${JSON.stringify(part)}::jsonb, now()
                )
                ON CONFLICT (id) DO UPDATE SET
                  checkin = EXCLUDED.checkin,
                  checkin_date = EXCLUDED.checkin_date,
                  sincronizado_em = now()
              `;
            }
          } catch (errPart) {
            this.logger.warn(`Erro ao buscar participantes de order ${order.id}: ${errPart}`);
          }
        }
        temMais = resp.pagination.has_next;
        pagina++;
      }

      // 3. Atualizar totais do evento
      await this.prisma.$executeRaw`
        UPDATE sympla_eventos SET
          total_pedidos = (SELECT COUNT(*) FROM sympla_orders WHERE evento_id = ${eventoId} AND status = 'A'),
          total_receita = (SELECT COALESCE(SUM(total_sale_price), 0) FROM sympla_orders WHERE evento_id = ${eventoId} AND status = 'A'),
          total_liquido = (SELECT COALESCE(SUM(total_net_value), 0) FROM sympla_orders WHERE evento_id = ${eventoId} AND status = 'A'),
          sincronizado_em = now(),
          atualizado_em = now()
        WHERE id = ${eventoId}
      `;

      // 4. Vincular ao CRM (deduplicação por CPF > email > telefone)
      await this.vincularOrdersCrm(eventoId);

      await this.fecharLog(logId, { total: totalOrders, novos: totalOrders, atualizados: 0 });
      return { orders: totalOrders, participantes: totalParticipantes };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.fecharLog(logId, { total: totalOrders, erro: msg });
      throw err;
    }
  }

  /** Vincula orders ao CRM por CPF > email > telefone (deduplicação PRD §4). */
  private async vincularOrdersCrm(eventoId: number) {
    // 1. Vincular por CPF (document)
    await this.prisma.$executeRaw`
      UPDATE sympla_orders so
      SET crm_cliente_id = c.id
      FROM crm_clientes c
      WHERE so.evento_id = ${eventoId}
        AND so.buyer_cpf IS NOT NULL
        AND so.buyer_cpf != ''
        AND c.documento = so.buyer_cpf
        AND so.crm_cliente_id IS NULL
    `;
    // 2. Vincular por email
    await this.prisma.$executeRaw`
      UPDATE sympla_orders so
      SET crm_cliente_id = c.id
      FROM crm_clientes c
      WHERE so.evento_id = ${eventoId}
        AND so.buyer_email IS NOT NULL
        AND c.email = so.buyer_email
        AND so.crm_cliente_id IS NULL
    `;
    // 3. Vincular participantes por CPF
    await this.prisma.$executeRaw`
      UPDATE sympla_participantes sp
      SET crm_cliente_id = c.id
      FROM crm_clientes c
      WHERE sp.evento_id = ${eventoId}
        AND sp.cpf IS NOT NULL AND sp.cpf != ''
        AND c.documento = sp.cpf
        AND sp.crm_cliente_id IS NULL
    `;
    // 4. Vincular participantes por email
    await this.prisma.$executeRaw`
      UPDATE sympla_participantes sp
      SET crm_cliente_id = c.id
      FROM crm_clientes c
      WHERE sp.evento_id = ${eventoId}
        AND sp.email IS NOT NULL
        AND c.email = sp.email
        AND sp.crm_cliente_id IS NULL
    `;
  }

  /** Sync completo: eventos + todas as orders de cada evento (pode demorar). */
  async syncCompleto(u?: UsuarioLogado) {
    const logId = await this.criarLogSync('full', undefined, u?.id);
    try {
      const evResp = await this.sincronizarEventos(u);
      // Pega os eventos sincronizados
      const eventos = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM sympla_eventos WHERE cancelado = false ORDER BY data_inicio DESC LIMIT 100
      `;
      let totalOrders = 0;
      let totalParts = 0;
      for (const ev of eventos) {
        try {
          const res = await this.sincronizarEvento(Number(ev.id), u);
          totalOrders += res.orders;
          totalParts += res.participantes;
        } catch (err) {
          this.logger.warn(`Erro ao sincronizar evento ${ev.id}: ${err}`);
        }
      }
      await this.fecharLog(logId, { total: totalOrders + totalParts, novos: totalOrders });
      return { eventos: evResp.total, orders: totalOrders, participantes: totalParts };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.fecharLog(logId, { erro: msg });
      throw err;
    }
  }

  /** Historico de sincronizações. */
  async historicoSync(limite = 20) {
    return this.prisma.$queryRaw`
      SELECT id, tipo, referencia_id, status, total_registros, novos, atualizados,
             erros, erro_mensagem, iniciado_em, concluido_em,
             EXTRACT(EPOCH FROM (COALESCE(concluido_em, now()) - iniciado_em))::int as duracao_s
      FROM sympla_sync_log
      ORDER BY iniciado_em DESC
      LIMIT ${limite}
    `;
  }
}
