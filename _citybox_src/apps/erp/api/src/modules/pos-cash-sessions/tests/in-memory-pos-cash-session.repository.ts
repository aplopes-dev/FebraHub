import { isCashPaymentMethod } from '../domain/cash-expected';
import { PosCashMovement } from '../domain/entities/pos-cash-movement.entity';
import { PosCashSession } from '../domain/entities/pos-cash-session.entity';
import {
  PosCashSessionRepository,
  type ClosingReport,
  type ListCashSessionsCriteria,
  type ListCashSessionsResult,
  type ListSessionSalesResult,
  type SessionSale,
} from '../domain/repositories/pos-cash-session.repository.interface';

type TerminalMeta = { id: string; name: string };

export class InMemoryPosCashSessionRepository extends PosCashSessionRepository {
  private readonly sessions = new Map<string, PosCashSession>();
  private readonly movements = new Map<string, PosCashMovement[]>();
  private readonly sales = new Map<string, SessionSale[]>();
  private readonly terminals = new Map<string, TerminalMeta>();

  registerTerminal(terminal: TerminalMeta): void {
    this.terminals.set(terminal.id, terminal);
  }

  registerSale(sale: SessionSale): void {
    const list = this.sales.get(sale.sessionId) ?? [];
    this.sales.set(sale.sessionId, [...list, sale]);
  }

  findById(organizationId: string, id: string): Promise<PosCashSession | null> {
    const found = this.sessions.get(id);
    if (!found || found.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(found);
  }

  findOpenByTerminal(
    organizationId: string,
    posTerminalId: string,
  ): Promise<PosCashSession | null> {
    const found = [...this.sessions.values()].find(
      (session) =>
        session.organizationId === organizationId &&
        session.posTerminalId === posTerminalId &&
        session.status === 'open',
    );
    return Promise.resolve(found ?? null);
  }

  save(session: PosCashSession): Promise<PosCashSession> {
    this.sessions.set(session.id, session);
    if (!this.movements.has(session.id)) {
      this.movements.set(session.id, []);
    }
    return Promise.resolve(session);
  }

  addMovement(movement: PosCashMovement): Promise<PosCashMovement> {
    const list = this.movements.get(movement.sessionId) ?? [];
    this.movements.set(movement.sessionId, [...list, movement]);
    return Promise.resolve(movement);
  }

  listMovements(
    organizationId: string,
    sessionId: string,
  ): Promise<PosCashMovement[]> {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve([]);
    }
    const list = this.movements.get(sessionId) ?? [];
    return Promise.resolve(
      [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    );
  }

  listSessions(
    criteria: ListCashSessionsCriteria,
  ): Promise<ListCashSessionsResult> {
    let items = [...this.sessions.values()].filter(
      (session) => session.organizationId === criteria.organizationId,
    );
    if (criteria.posTerminalId) {
      items = items.filter(
        (session) => session.posTerminalId === criteria.posTerminalId,
      );
    }
    if (criteria.operatorName?.trim()) {
      const needle = criteria.operatorName.trim().toLowerCase();
      items = items.filter((session) =>
        session.openedByName.toLowerCase().includes(needle),
      );
    }
    if (criteria.openedFrom) {
      const from = criteria.openedFrom;
      items = items.filter((session) => session.openedAt >= from);
    }
    if (criteria.openedTo) {
      const to = criteria.openedTo;
      items = items.filter((session) => session.openedAt <= to);
    }
    items.sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    const total = items.length;
    const start = (criteria.page - 1) * criteria.perPage;
    const pageItems = items
      .slice(start, start + criteria.perPage)
      .map((session) => {
        const movements = this.movements.get(session.id) ?? [];
        const sales = this.sales.get(session.id) ?? [];
        return {
          session,
          posTerminalName:
            this.terminals.get(session.posTerminalId)?.name ??
            session.posTerminalId,
          salesCount: sales.filter((sale) => sale.status !== 'cancelled')
            .length,
          withdrawalCount: movements.filter((m) => m.type === 'withdrawal')
            .length,
        };
      });
    return Promise.resolve({ items: pageItems, total });
  }

  sumCashPaymentsCents(
    organizationId: string,
    sessionId: string,
  ): Promise<number> {
    const sales = (this.sales.get(sessionId) ?? []).filter(
      (sale) => sale.sessionId === sessionId && sale.status === 'closed',
    );
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve(0);
    }
    let total = 0;
    for (const sale of sales) {
      for (const payment of sale.payments) {
        if (isCashPaymentMethod(payment.methodSystemKey, payment.methodName)) {
          total += payment.amountCents;
        }
      }
    }
    return Promise.resolve(total);
  }

  sumMovementsByType(
    organizationId: string,
    sessionId: string,
  ): Promise<{ reinforcementCents: number; withdrawalCents: number }> {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve({ reinforcementCents: 0, withdrawalCents: 0 });
    }
    const list = this.movements.get(sessionId) ?? [];
    return Promise.resolve({
      reinforcementCents: list
        .filter((m) => m.type === 'reinforcement')
        .reduce((sum, m) => sum + m.amountCents, 0),
      withdrawalCents: list
        .filter((m) => m.type === 'withdrawal')
        .reduce((sum, m) => sum + m.amountCents, 0),
    });
  }

  listSessionSales(
    organizationId: string,
    sessionId: string,
    page: number,
    perPage: number,
  ): Promise<ListSessionSalesResult> {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve({ items: [], total: 0 });
    }
    const all = [...(this.sales.get(sessionId) ?? [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const start = (page - 1) * perPage;
    return Promise.resolve({
      items: all.slice(start, start + perPage),
      total: all.length,
    });
  }

  findSessionSale(
    organizationId: string,
    sessionId: string,
    saleOrderId: string,
  ): Promise<SessionSale | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    const found = (this.sales.get(sessionId) ?? []).find(
      (sale) => sale.id === saleOrderId,
    );
    return Promise.resolve(found ?? null);
  }

  getClosingReport(
    organizationId: string,
    sessionId: string,
  ): Promise<ClosingReport | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    const sales = this.sales.get(sessionId) ?? [];
    const byMethod = new Map<
      string,
      { method: string; systemKey: string | null; registeredCents: number }
    >();
    for (const sale of sales) {
      if (sale.status === 'cancelled') continue;
      for (const payment of sale.payments) {
        const key = payment.methodId;
        const current = byMethod.get(key) ?? {
          method: payment.methodName,
          systemKey: payment.methodSystemKey,
          registeredCents: 0,
        };
        byMethod.set(key, {
          ...current,
          registeredCents: current.registeredCents + payment.amountCents,
        });
      }
    }
    const methods = [...byMethod.values()].map((row) => {
      const isCash = isCashPaymentMethod(row.systemKey, row.method);
      return {
        method: row.method,
        systemKey: row.systemKey,
        registeredCents: row.registeredCents,
        informedCents: isCash ? (session.countedCashCents ?? 0) : 0,
      };
    });
    return Promise.resolve({
      session,
      posTerminalName:
        this.terminals.get(session.posTerminalId)?.name ??
        session.posTerminalId,
      salesCount: sales.filter((s) => s.status !== 'cancelled').length,
      canceledSalesCount: sales.filter((s) => s.status === 'cancelled').length,
      methods,
    });
  }

  clear(): void {
    this.sessions.clear();
    this.movements.clear();
    this.sales.clear();
    this.terminals.clear();
  }
}
