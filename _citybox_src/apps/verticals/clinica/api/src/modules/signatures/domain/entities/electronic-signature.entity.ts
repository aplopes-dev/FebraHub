import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type ElectronicSignatureKind =
  | 'anamnesis'
  | 'contract'
  | 'evolution_batch';

export type ElectronicSignatureStatus =
  | 'pending'
  | 'signed'
  | 'refused'
  | 'cancelled'
  | 'expired';

export type ElectronicSignerRole = 'patient' | 'responsible';

export type ElectronicSignerStatus =
  | 'new'
  | 'pending'
  | 'signed'
  | 'refused';

export type ElectronicSigner = {
  role: ElectronicSignerRole;
  name: string;
  email: string;
  phone: string;
  zapsignSignerToken: string;
  signUrl: string;
  status: ElectronicSignerStatus;
  /** ISO datetime when this signer signed (ZapSign `signed_at`). */
  signedAt: string | null;
};

export type ElectronicSignatureProps = {
  storeId: string;
  patientId: string;
  kind: ElectronicSignatureKind;
  targetId: string | null;
  targetIds: string[] | null;
  zapsignDocumentToken: string;
  status: ElectronicSignatureStatus;
  originalPdfObjectKey: string;
  signedPdfObjectKey: string | null;
  signers: ElectronicSigner[];
  requestedById: string;
  requestedByName: string;
  requestedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ElectronicSignature extends Entity<ElectronicSignatureProps> {
  constructor(props: ElectronicSignatureProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      ElectronicSignatureProps,
      | 'targetId'
      | 'targetIds'
      | 'status'
      | 'signedPdfObjectKey'
      | 'completedAt'
      | 'cancelledAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): ElectronicSignature {
    const now = new Date();
    return new ElectronicSignature(
      {
        targetId: props.targetId ?? null,
        targetIds: props.targetIds ?? null,
        status: props.status ?? 'pending',
        signedPdfObjectKey: props.signedPdfObjectKey ?? null,
        completedAt: props.completedAt ?? null,
        cancelledAt: props.cancelledAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        kind: props.kind,
        zapsignDocumentToken: props.zapsignDocumentToken,
        originalPdfObjectKey: props.originalPdfObjectKey,
        signers: props.signers,
        requestedById: props.requestedById,
        requestedByName: props.requestedByName,
        requestedAt: props.requestedAt,
      },
      id,
    );
  }

  static with(
    props: ElectronicSignatureProps,
    id: string,
  ): ElectronicSignature {
    return new ElectronicSignature(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get kind(): ElectronicSignatureKind {
    return this.props.kind;
  }
  get targetId(): string | null {
    return this.props.targetId;
  }
  get targetIds(): string[] | null {
    return this.props.targetIds;
  }
  get zapsignDocumentToken(): string {
    return this.props.zapsignDocumentToken;
  }
  get status(): ElectronicSignatureStatus {
    return this.props.status;
  }
  get originalPdfObjectKey(): string {
    return this.props.originalPdfObjectKey;
  }
  get signedPdfObjectKey(): string | null {
    return this.props.signedPdfObjectKey;
  }
  get signers(): ElectronicSigner[] {
    return this.props.signers;
  }
  get requestedById(): string {
    return this.props.requestedById;
  }
  get requestedByName(): string {
    return this.props.requestedByName;
  }
  get requestedAt(): Date {
    return this.props.requestedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withUpdatedSigners(signers: ElectronicSigner[]): ElectronicSignature {
    return ElectronicSignature.create(
      {
        ...this.props,
        signers,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withSigned(signedPdfObjectKey: string): ElectronicSignature {
    return ElectronicSignature.create(
      {
        ...this.props,
        status: 'signed',
        signedPdfObjectKey,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Todos assinaram; PDF assinado pode ser anexado depois. */
  withAllSignersCompleted(): ElectronicSignature {
    return ElectronicSignature.create(
      {
        ...this.props,
        status: 'signed',
        completedAt: this.props.completedAt ?? new Date(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withCancelled(): ElectronicSignature {
    return ElectronicSignature.create(
      {
        ...this.props,
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withStatus(
    status: Exclude<ElectronicSignatureStatus, 'signed' | 'cancelled'>,
  ): ElectronicSignature {
    return ElectronicSignature.create(
      {
        ...this.props,
        status,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
