import {
  ElectronicSignature,
  type ElectronicSignatureKind,
} from '../domain/entities/electronic-signature.entity';
import {
  ElectronicSignatureRepository,
  type ElectronicSignaturePatientListCriteria,
  type ElectronicSignaturePatientListResult,
  type ElectronicSignatureReportCriteria,
  type ElectronicSignatureReportResult,
} from '../domain/repositories/electronic-signature.repository.interface';

export class InMemoryElectronicSignatureRepository extends ElectronicSignatureRepository {
  private readonly items = new Map<string, ElectronicSignature>();
  private readonly patientNames = new Map<string, string>();

  /** Helper de teste: associa nome do paciente ao id. */
  setPatientName(patientId: string, name: string): void {
    this.patientNames.set(patientId, name);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ElectronicSignature | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findByZapsignToken(
    zapsignDocumentToken: string,
  ): Promise<ElectronicSignature | null> {
    for (const item of this.items.values()) {
      if (item.zapsignDocumentToken === zapsignDocumentToken) {
        return item;
      }
    }
    return null;
  }

  async findPendingByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null> {
    for (const item of this.items.values()) {
      if (
        item.storeId === storeId &&
        item.kind === kind &&
        item.status === 'pending' &&
        this.matchesTarget(item, targetId)
      ) {
        return item;
      }
    }
    return null;
  }

  async findLatestByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null> {
    let latest: ElectronicSignature | null = null;
    for (const item of this.items.values()) {
      if (
        item.storeId !== storeId ||
        item.kind !== kind ||
        !this.matchesTarget(item, targetId)
      ) {
        continue;
      }
      if (
        !latest ||
        item.requestedAt.getTime() > latest.requestedAt.getTime()
      ) {
        latest = item;
      }
    }
    return latest;
  }

  private matchesTarget(item: ElectronicSignature, targetId: string): boolean {
    if (item.targetId === targetId) return true;
    return (item.targetIds ?? []).includes(targetId);
  }

  async findPendingOverlappingTargets(
    storeId: string,
    patientId: string,
    targetIds: string[],
  ): Promise<ElectronicSignature | null> {
    const targetSet = new Set(targetIds);
    for (const item of this.items.values()) {
      if (
        item.storeId !== storeId ||
        item.patientId !== patientId ||
        item.kind !== 'evolution_batch' ||
        item.status !== 'pending'
      ) {
        continue;
      }
      const ids = item.targetIds ?? [];
      if (ids.some((id) => targetSet.has(id))) {
        return item;
      }
    }
    return null;
  }

  async findManyForReport(
    storeId: string,
    criteria: ElectronicSignatureReportCriteria,
  ): Promise<ElectronicSignatureReportResult> {
    const start = new Date(`${criteria.startDate}T00:00:00.000Z`).getTime();
    const end = new Date(`${criteria.endDate}T23:59:59.999Z`).getTime();

    const inPeriod = [...this.items.values()].filter((item) => {
      if (item.storeId !== storeId) return false;
      const t = item.requestedAt.getTime();
      if (t < start || t > end) return false;
      if (
        criteria.kinds &&
        criteria.kinds.length > 0 &&
        !criteria.kinds.includes(item.kind)
      ) {
        return false;
      }
      return true;
    });

    let enviados = 0;
    let pendentes = 0;
    let assinados = 0;
    for (const item of inPeriod) {
      enviados += 1;
      if (item.status === 'pending') pendentes += 1;
      if (item.status === 'signed') assinados += 1;
    }

    const listStatuses =
      criteria.statuses && criteria.statuses.length > 0
        ? new Set(criteria.statuses)
        : null;

    const filtered = inPeriod
      .filter((item) => (listStatuses ? listStatuses.has(item.status) : true))
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    const page = filtered.slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );

    return {
      items: page.map((signature) => ({
        signature,
        patientName:
          this.patientNames.get(signature.patientId) ??
          `Paciente ${signature.patientId.slice(0, 8)}`,
      })),
      total: filtered.length,
      stats: { enviados, pendentes, assinados },
    };
  }

  async findManyByPatient(
    storeId: string,
    patientId: string,
    criteria: ElectronicSignaturePatientListCriteria,
  ): Promise<ElectronicSignaturePatientListResult> {
    const filtered = [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId &&
          item.patientId === patientId &&
          item.status === criteria.status,
      )
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    return {
      items: filtered.slice(criteria.skip, criteria.skip + criteria.take),
      total: filtered.length,
    };
  }

  async save(signature: ElectronicSignature): Promise<ElectronicSignature> {
    this.items.set(signature.id, signature);
    return signature;
  }
}
