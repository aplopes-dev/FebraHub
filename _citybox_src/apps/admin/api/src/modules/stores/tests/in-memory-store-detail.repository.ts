import {
  getIntegrationCatalogForVertical,
  getModuleCatalogForVertical,
} from '../domain/catalog/store-vertical.catalog';
import type { StoreVertical } from '../domain/entities/store.entity';
import {
  StoreDetailRepository,
  type RecordStoreAuditEventInput,
  type StoreAuditEventRow,
  type StoreAuditLogCriteria,
  type StoreDetailRelatedRows,
  type StoreMemberRow,
  type UpsertStoreMemberInput,
  type GlobalMemberLookupResult,
} from '../domain/repositories/store-detail.repository.interface';

type IntegrationState = { label: string; status: string };

export class InMemoryStoreDetailRepository extends StoreDetailRepository {
  private members = new Map<string, StoreMemberRow[]>();
  private globalMembers = new Map<string, StoreMemberRow>();
  /** Sequencial, não `Date.now()`: dois membros criados no mesmo milissegundo colidiriam
   *  e o teste ficaria intermitente. */
  private memberIdSeq = 0;
  private moduleStates = new Map<string, Map<string, boolean>>();
  private integrations = new Map<string, Map<string, IntegrationState>>();
  private auditEvents = new Map<string, StoreAuditEventRow[]>();

  ensureCatalog(storeId: string, vertical: StoreVertical): Promise<void> {
    if (!this.moduleStates.has(storeId)) {
      this.moduleStates.set(storeId, new Map());
    }
    if (!this.integrations.has(storeId)) {
      this.integrations.set(storeId, new Map());
    }

    const modules = this.moduleStates.get(storeId);
    if (!modules) {
      return Promise.resolve();
    }
    for (const item of getModuleCatalogForVertical(vertical)) {
      if (!modules.has(item.moduleKey)) {
        modules.set(item.moduleKey, false);
      }
    }

    const integrationMap = this.integrations.get(storeId);
    if (!integrationMap) {
      return Promise.resolve();
    }
    for (const item of getIntegrationCatalogForVertical(vertical)) {
      if (!integrationMap.has(item.integrationKey)) {
        integrationMap.set(item.integrationKey, {
          label: item.label,
          status: 'disconnected',
        });
      }
    }
    return Promise.resolve();
  }

  async findRelatedByStoreId(
    storeId: string,
    vertical: StoreVertical,
  ): Promise<StoreDetailRelatedRows> {
    await this.ensureCatalog(storeId, vertical);

    const moduleCatalog = getModuleCatalogForVertical(vertical);
    const modules = moduleCatalog.map((item, index) => ({
      id: `module-${index}`,
      moduleKey: item.moduleKey,
      label: item.label,
      enabled: this.moduleStates.get(storeId)?.get(item.moduleKey) ?? false,
      description: item.description,
    }));

    const integrationCatalog = getIntegrationCatalogForVertical(vertical);
    const integrationMap =
      this.integrations.get(storeId) ?? new Map<string, IntegrationState>();
    const integrations = integrationCatalog.map((item, index) => {
      const stored = integrationMap.get(item.integrationKey);
      return {
        id: `integration-${index}`,
        integrationKey: item.integrationKey,
        label: stored?.label ?? item.label,
        status: (stored?.status ?? 'disconnected') as
          | 'connected'
          | 'disconnected'
          | 'error',
      };
    });

    return {
      terminals: [],
      errors: [],
      members: this.members.get(storeId) ?? [],
      modules,
      integrations,
    };
  }

  updateModuleEnabled(
    storeId: string,
    moduleKey: string,
    enabled: boolean,
  ): Promise<void> {
    const modules =
      this.moduleStates.get(storeId) ?? new Map<string, boolean>();
    modules.set(moduleKey, enabled);
    this.moduleStates.set(storeId, modules);
    return Promise.resolve();
  }

  listMembers(storeId: string): Promise<StoreMemberRow[]> {
    return Promise.resolve(this.members.get(storeId) ?? []);
  }

  findMemberById(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow | null> {
    return Promise.resolve(
      (this.members.get(storeId) ?? []).find(
        (member) => member.id === memberId,
      ) ?? null,
    );
  }

  findMemberByStoreAndSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<StoreMemberRow | null> {
    return Promise.resolve(
      (this.members.get(storeId) ?? []).find(
        (member) => member.keycloakSub === keycloakSub,
      ) ?? null,
    );
  }

  async findMemberByEmailOrUsername(
    email?: string,
    username?: string,
  ): Promise<GlobalMemberLookupResult | null> {
    const e = email?.trim().toLowerCase();
    const u = username?.trim().toLowerCase();

    for (const gm of this.globalMembers.values()) {
      if (
        (e && gm.email?.toLowerCase() === e) ||
        (u && gm.username.toLowerCase() === u)
      ) {
        return {
          id: gm.id,
          keycloakSub: gm.keycloakSub,
          username: gm.username,
          email: gm.email ?? '',
          firstName: gm.firstName,
          lastName: gm.lastName,
          hasPassword: gm.hasPassword,
        };
      }
    }
    return null;
  }

  async findGlobalMemberById(
    memberId: string,
  ): Promise<GlobalMemberLookupResult | null> {
    for (const gm of this.globalMembers.values()) {
      if (gm.id === memberId) {
        return {
          id: gm.id,
          keycloakSub: gm.keycloakSub,
          username: gm.username,
          email: gm.email ?? '',
          firstName: gm.firstName,
          lastName: gm.lastName,
          hasPassword: gm.hasPassword,
        };
      }
    }
    return null;
  }

  async createMember(input: UpsertStoreMemberInput): Promise<StoreMemberRow> {
    const existingGlobal = this.globalMembers.get(input.keycloakSub);

    const memberId = existingGlobal
      ? existingGlobal.id
      : `member-${++this.memberIdSeq}`;
    const member: StoreMemberRow = {
      id: memberId,
      keycloakSub: input.keycloakSub,
      username: input.username,
      email: input.email ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      permissions: input.permissions,
      hasPassword: input.hasPassword ?? false,
      disabledAt: null,
      provisionalExpiresAt: input.provisionalExpiresAt ?? null,
    };

    if (!existingGlobal) {
      this.globalMembers.set(input.keycloakSub, { ...member });
    }

    const list = this.members.get(input.storeId) ?? [];
    list.push(member);
    this.members.set(input.storeId, list);
    return Promise.resolve(member);
  }

  updateMember(
    storeId: string,
    memberId: string,
    input: Omit<
      UpsertStoreMemberInput,
      'storeId' | 'keycloakSub' | 'username' | 'email'
    >,
  ): Promise<StoreMemberRow> {
    const list = this.members.get(storeId) ?? [];
    const index = list.findIndex((member) => member.id === memberId);
    const existing = index >= 0 ? list[index] : undefined;
    if (!existing) {
      return Promise.reject(new Error('Store member not found'));
    }

    // Atualizar no global
    const globalEx = this.globalMembers.get(existing.keycloakSub);
    if (globalEx) {
      this.globalMembers.set(existing.keycloakSub, {
        ...globalEx,
        firstName: input.firstName,
        lastName: input.lastName,
      });
    }

    const updated: StoreMemberRow = {
      ...existing,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      permissions: input.permissions,
    };
    list[index] = updated;
    this.members.set(storeId, list);
    return Promise.resolve(updated);
  }

  markMemberHasPassword(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow> {
    const list = this.members.get(storeId) ?? [];
    const index = list.findIndex((member) => member.id === memberId);
    const existing = index >= 0 ? list[index] : undefined;
    if (!existing) {
      return Promise.reject(new Error('Store member not found'));
    }
    const globalEx = this.globalMembers.get(existing.keycloakSub);
    if (globalEx) {
      this.globalMembers.set(existing.keycloakSub, {
        ...globalEx,
        hasPassword: true,
        provisionalExpiresAt: null,
      });
    }

    const updated: StoreMemberRow = {
      ...existing,
      hasPassword: true,
      provisionalExpiresAt: null,
    };
    list[index] = updated;
    this.members.set(storeId, list);
    return Promise.resolve(updated);
  }

  setMemberDisabled(
    storeId: string,
    memberId: string,
    disabledAt: Date | null,
  ): Promise<StoreMemberRow> {
    const list = this.members.get(storeId) ?? [];
    const index = list.findIndex((member) => member.id === memberId);
    const existing = index >= 0 ? list[index] : undefined;
    if (!existing) {
      return Promise.reject(new Error('Store member not found'));
    }
    const updated: StoreMemberRow = { ...existing, disabledAt };
    list[index] = updated;
    this.members.set(storeId, list);
    return Promise.resolve(updated);
  }

  setMemberProvisionalExpiresAt(
    storeId: string,
    memberId: string,
    provisionalExpiresAt: Date | null,
  ): Promise<StoreMemberRow> {
    const list = this.members.get(storeId) ?? [];
    const index = list.findIndex((member) => member.id === memberId);
    const existing = index >= 0 ? list[index] : undefined;
    if (!existing) {
      return Promise.reject(new Error('Store member not found'));
    }
    const updated: StoreMemberRow = { ...existing, provisionalExpiresAt };
    list[index] = updated;
    this.members.set(storeId, list);
    return Promise.resolve(updated);
  }

  deleteMember(storeId: string, memberId: string): Promise<void> {
    const list = (this.members.get(storeId) ?? []).filter(
      (member) => member.id !== memberId,
    );
    this.members.set(storeId, list);
    return Promise.resolve();
  }

  recordAuditEvent(input: RecordStoreAuditEventInput): Promise<void> {
    const event: StoreAuditEventRow = {
      id: `audit-${Date.now()}`,
      occurredAt: new Date(),
      severity: input.severity ?? 'info',
      actor: input.actor,
      actorRole: input.actorRole ?? null,
      module: input.module,
      action: input.action,
      details: input.details ?? null,
    };
    const list = this.auditEvents.get(input.storeId) ?? [];
    list.unshift(event);
    this.auditEvents.set(input.storeId, list);
    return Promise.resolve();
  }

  listAuditEvents(criteria: StoreAuditLogCriteria): Promise<{
    items: StoreAuditEventRow[];
    total: number;
  }> {
    let items = [...(this.auditEvents.get(criteria.storeId) ?? [])];

    if (criteria.severity?.length) {
      const severities = criteria.severity;
      items = items.filter((item) => severities.includes(item.severity));
    }

    if (criteria.search?.trim()) {
      const q = criteria.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.actor.toLowerCase().includes(q) ||
          item.action.toLowerCase().includes(q),
      );
    }

    const total = items.length;
    const start = criteria.skip ?? 0;
    const end = criteria.take ? start + criteria.take : undefined;
    items = items.slice(start, end);

    return Promise.resolve({ items, total });
  }

  clear(): void {
    this.members.clear();
    this.globalMembers.clear();
    this.moduleStates.clear();
    this.integrations.clear();
    this.auditEvents.clear();
  }

  addGlobalMember(
    member: Omit<StoreMemberRow, 'disabledAt' | 'provisionalExpiresAt'> &
      Partial<Pick<StoreMemberRow, 'disabledAt' | 'provisionalExpiresAt'>>,
  ): void {
    this.globalMembers.set(member.keycloakSub, {
      disabledAt: null,
      provisionalExpiresAt: null,
      ...member,
    });
  }
}
