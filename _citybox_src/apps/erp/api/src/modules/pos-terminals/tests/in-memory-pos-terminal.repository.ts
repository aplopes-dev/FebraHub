import { PosTerminal } from '../domain/entities/pos-terminal.entity';
import {
  PosTerminalRepository,
  type PosTerminalListCriteria,
} from '../domain/repositories/pos-terminal.repository.interface';

export class InMemoryPosTerminalRepository extends PosTerminalRepository {
  private readonly items = new Map<string, PosTerminal>();

  findById(organizationId: string, id: string): Promise<PosTerminal | null> {
    const item = this.items.get(id);
    return Promise.resolve(
      item && item.organizationId === organizationId ? item : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: PosTerminalListCriteria = {},
  ): Promise<PosTerminal[]> {
    return Promise.resolve(this.filter(organizationId, criteria));
  }

  count(
    organizationId: string,
    criteria: PosTerminalListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(
      this.filter(organizationId, { ...criteria, skip: 0, take: undefined })
        .length,
    );
  }

  save(posTerminal: PosTerminal): Promise<PosTerminal> {
    this.items.set(posTerminal.id, posTerminal);
    return Promise.resolve(posTerminal);
  }

  saveUnscoped(posTerminal: PosTerminal): Promise<PosTerminal> {
    return this.save(posTerminal);
  }

  findByPairingCode(code: string): Promise<PosTerminal | null> {
    const needle = code.trim().toUpperCase();
    const found = [...this.items.values()].find(
      (item) => item.pairingCode === needle && !item.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  findByDeviceTokenHash(hash: string): Promise<PosTerminal | null> {
    const found = [...this.items.values()].find(
      (item) => item.deviceTokenHash === hash && !item.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  private filter(
    organizationId: string,
    criteria: PosTerminalListCriteria,
  ): PosTerminal[] {
    const search = criteria.search?.trim().toLowerCase();
    const allowed = criteria.allowedBranchIds ?? null;

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => !item.deletedAt)
      .filter((item) =>
        criteria.status ? item.status === criteria.status : true,
      )
      .filter((item) => (allowed ? allowed.includes(item.branchId) : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (search) {
      list = list.filter((item) => item.name.toLowerCase().includes(search));
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    if (take === undefined) return list.slice(skip);
    return list.slice(skip, skip + take);
  }

  clear(): void {
    this.items.clear();
  }
}
