import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

import { SalesOpportunityZodValidator } from '../validators/sales-opportunity.zod.validator';
import {
  onlyDigits,
  type SalesOpportunityOrigin,
  type SalesOpportunityPatientSnapshot,
  type SalesOpportunityProps,
} from '../sales-opportunity.types';

export class SalesOpportunity extends Entity<SalesOpportunityProps> {
  constructor(props: SalesOpportunityProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    SalesOpportunityZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<
      SalesOpportunityProps,
      | 'description'
      | 'phone'
      | 'origin'
      | 'nextContact'
      | 'patientId'
      | 'labelId'
      | 'submissionId'
      | 'budgetId'
      | 'sortOrder'
      | 'lastInteractionAt'
      | 'createdAt'
      | 'updatedAt'
      | 'patient'
      | 'stageType'
    >,
    id?: string,
  ): SalesOpportunity {
    const now = new Date();
    return new SalesOpportunity(
      {
        storeId: props.storeId,
        funnelId: props.funnelId,
        stageId: props.stageId,
        title: props.title,
        description: props.description ?? null,
        phone: onlyDigits(props.phone ?? null),
        origin: props.origin ?? null,
        nextContact: props.nextContact ?? null,
        patientId: props.patientId ?? null,
        labelId: props.labelId ?? null,
        submissionId: props.submissionId ?? null,
        budgetId: props.budgetId ?? null,
        sortOrder: props.sortOrder ?? 0,
        lastInteractionAt: props.lastInteractionAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        patient: props.patient ?? null,
        stageType: props.stageType,
      },
      id,
    );
  }

  public static with(
    props: SalesOpportunityProps,
    id: string,
  ): SalesOpportunity {
    return new SalesOpportunity(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get funnelId() {
    return this.props.funnelId;
  }
  get stageId() {
    return this.props.stageId;
  }
  get title() {
    return this.props.title;
  }
  get description() {
    return this.props.description;
  }
  get phone() {
    return this.props.phone;
  }
  get origin() {
    return this.props.origin;
  }
  get nextContact() {
    return this.props.nextContact;
  }
  get patientId() {
    return this.props.patientId;
  }
  get labelId() {
    return this.props.labelId;
  }
  get submissionId() {
    return this.props.submissionId;
  }
  get budgetId() {
    return this.props.budgetId;
  }
  get sortOrder() {
    return this.props.sortOrder;
  }
  get lastInteractionAt() {
    return this.props.lastInteractionAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get patient() {
    return this.props.patient ?? null;
  }
  get stageType() {
    return this.props.stageType;
  }
  get isTerminal(): boolean {
    return this.props.stageType === 'won' || this.props.stageType === 'lost';
  }

  public withUpdate(input: {
    title?: string;
    description?: string | null;
    phone?: string | null;
    origin?: SalesOpportunityOrigin | null;
    nextContact?: Date | null;
    patientId?: string | null;
    labelId?: string | null;
    stageId?: string;
    sortOrder?: number;
    stageType?: 'others' | 'won' | 'lost';
    patient?: SalesOpportunityPatientSnapshot | null;
  }): SalesOpportunity {
    const now = new Date();
    return SalesOpportunity.create(
      {
        storeId: this.storeId,
        funnelId: this.funnelId,
        stageId: input.stageId ?? this.stageId,
        title: input.title ?? this.title,
        description:
          input.description !== undefined
            ? input.description
            : this.description,
        phone: input.phone !== undefined ? onlyDigits(input.phone) : this.phone,
        origin: input.origin !== undefined ? input.origin : this.origin,
        nextContact:
          input.nextContact !== undefined
            ? input.nextContact
            : this.nextContact,
        patientId:
          input.patientId !== undefined ? input.patientId : this.patientId,
        labelId: input.labelId !== undefined ? input.labelId : this.labelId,
        submissionId: this.submissionId,
        budgetId: this.budgetId,
        sortOrder:
          input.sortOrder !== undefined ? input.sortOrder : this.sortOrder,
        lastInteractionAt: now,
        createdAt: this.createdAt,
        updatedAt: now,
        patient: input.patient !== undefined ? input.patient : this.patient,
        stageType:
          input.stageType !== undefined ? input.stageType : this.stageType,
      },
      this.id,
    );
  }
}
