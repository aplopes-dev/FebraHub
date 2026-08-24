import {
  DEFAULT_CLINIC_STRAND,
  type ClinicStrand,
} from '@citybox/messaging';
import { Entity } from '../../../../shared/core/entity';

export type OrganizationStatus = 'active' | 'suspended';

/** Snapshot comercial vindo do platform-api por evento. Nulo até o 1º evento chegar. */
export type OrganizationPlanSnapshot = {
  planId: string | null;
  tier: string | null;
  maxClinics: number | null;
  maxUsers: number | null;
};

export type OrganizationProps = {
  storeId: string;
  name: string;
  status: OrganizationStatus;
  clinicStrand: ClinicStrand;
  plan: OrganizationPlanSnapshot;
  overQuota: boolean;
  suspendedReason: string | null;
  platformUpdatedAt: Date | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Conta operacional da loja dentro da clínica — 1:1 com a `Store` do platform-api.
 *
 * A referência `storeId` é lógica (vem por evento), não FK: os schemas são separados e
 * a vertical precisa poder ser extraída como produto independente.
 */
export class Organization extends Entity<OrganizationProps> {
  protected validate(): void {
    // Espelho comercial — a validação forte vive no platform-api, dono do dado.
  }

  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get status(): OrganizationStatus {
    return this.props.status;
  }
  get clinicStrand(): ClinicStrand {
    return this.props.clinicStrand;
  }
  get plan(): OrganizationPlanSnapshot {
    return this.props.plan;
  }
  get overQuota(): boolean {
    return this.props.overQuota;
  }
  get suspendedReason(): string | null {
    return this.props.suspendedReason;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  /**
   * Quota local de clínicas. `null` em `maxClinics` = plano ainda não sincronizado;
   * nesse caso liberamos, porque bloquear por falta de dado nosso puniria o cliente.
   */
  canCreateClinic(currentCount: number): boolean {
    if (this.props.overQuota) return false;
    const max = this.props.plan.maxClinics;
    if (max === null) return true;
    return currentCount < max;
  }

  suspend(reason: string | null): void {
    this.props.status = 'suspended';
    this.props.suspendedReason = reason;
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    this.props.status = 'active';
    this.props.suspendedReason = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Downgrade abaixo do uso atual **não apaga nada**: marca `overQuota`, que bloqueia
   * só a criação de novos recursos até o operador resolver.
   */
  applyPlan(plan: OrganizationPlanSnapshot, currentClinics: number): void {
    this.props.plan = plan;
    this.props.overQuota =
      plan.maxClinics !== null && currentClinics > plan.maxClinics;
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<OrganizationProps, 'createdAt' | 'updatedAt' | 'clinicStrand'> &
      Partial<Pick<OrganizationProps, 'createdAt' | 'updatedAt' | 'clinicStrand'>>,
    id?: string,
  ): Organization {
    return new Organization(
      {
        ...props,
        clinicStrand: props.clinicStrand ?? DEFAULT_CLINIC_STRAND,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: OrganizationProps, id: string): Organization {
    return new Organization(props, id);
  }
}
