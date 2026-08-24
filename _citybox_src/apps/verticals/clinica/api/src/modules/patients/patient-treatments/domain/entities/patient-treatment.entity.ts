import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { PatientTreatmentValidatorFactory } from '../factories/patient-treatment-validator.factory';

export type PatientTreatmentSource = 'budget' | 'standalone';

export type PatientTreatmentStatus = 'active' | 'completed';

export type PatientTreatmentLocationType =
  | 'tooth'
  | 'body_region'
  | 'session'
  | 'none';

export type PatientTreatmentProps = {
  storeId: string;
  patientId: string;
  source: PatientTreatmentSource;
  status: PatientTreatmentStatus;
  budgetId: string | null;
  budgetItemId: string | null;
  planId: string | null;
  treatmentId: string | null;
  professionalId: string | null;
  professionalName: string;
  planName: string;
  treatmentName: string;
  description: string;
  valueCents: number;
  locationType: PatientTreatmentLocationType;
  locationLabel: string;
  sessionIndex: number | null;
  sessionTotal: number | null;
  diagnosis: string;
  observation: string;
  sortOrder: number;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdatePatientTreatmentClinicalInput = {
  diagnosis: string;
  observation: string;
};

export class PatientTreatment extends Entity<PatientTreatmentProps> {
  constructor(props: PatientTreatmentProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientTreatmentValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      PatientTreatmentProps,
      | 'source'
      | 'status'
      | 'budgetId'
      | 'budgetItemId'
      | 'planId'
      | 'treatmentId'
      | 'professionalId'
      | 'professionalName'
      | 'planName'
      | 'treatmentName'
      | 'description'
      | 'locationType'
      | 'locationLabel'
      | 'sessionIndex'
      | 'sessionTotal'
      | 'diagnosis'
      | 'observation'
      | 'finalizedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): PatientTreatment {
    return new PatientTreatment(
      {
        ...props,
        source: props.source ?? 'standalone',
        status: props.status ?? 'active',
        budgetId: props.budgetId ?? null,
        budgetItemId: props.budgetItemId ?? null,
        planId: props.planId ?? null,
        treatmentId: props.treatmentId ?? null,
        professionalId: props.professionalId ?? null,
        professionalName: props.professionalName ?? '',
        planName: props.planName ?? '',
        treatmentName: props.treatmentName ?? '',
        description: props.description ?? '',
        locationType: props.locationType ?? 'none',
        locationLabel: props.locationLabel ?? '',
        sessionIndex: props.sessionIndex ?? null,
        sessionTotal: props.sessionTotal ?? null,
        diagnosis: props.diagnosis ?? '',
        observation: props.observation ?? '',
        finalizedAt: props.finalizedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: PatientTreatmentProps, id: string): PatientTreatment {
    return new PatientTreatment(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get source() {
    return this.props.source;
  }
  get status() {
    return this.props.status;
  }
  get budgetId() {
    return this.props.budgetId;
  }
  get budgetItemId() {
    return this.props.budgetItemId;
  }
  get planId() {
    return this.props.planId;
  }
  get treatmentId() {
    return this.props.treatmentId;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get professionalName() {
    return this.props.professionalName;
  }
  get planName() {
    return this.props.planName;
  }
  get treatmentName() {
    return this.props.treatmentName;
  }
  get description() {
    return this.props.description;
  }
  get valueCents() {
    return this.props.valueCents;
  }
  get locationType() {
    return this.props.locationType;
  }
  get locationLabel() {
    return this.props.locationLabel;
  }
  get sessionIndex() {
    return this.props.sessionIndex;
  }
  get sessionTotal() {
    return this.props.sessionTotal;
  }
  get diagnosis() {
    return this.props.diagnosis;
  }
  get observation() {
    return this.props.observation;
  }
  get sortOrder() {
    return this.props.sortOrder;
  }
  get finalizedAt() {
    return this.props.finalizedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  updateClinicalNotes(input: UpdatePatientTreatmentClinicalInput): void {
    this.props.diagnosis = input.diagnosis;
    this.props.observation = input.observation;
    this.touch();
    this.validate();
  }

  finalize(finalizedAt: Date): void {
    this.props.status = 'completed';
    this.props.finalizedAt = finalizedAt;
    this.touch();
    this.validate();
  }

  setSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
    this.touch();
    this.validate();
  }
}
