import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { PatientBodyMetricValidatorFactory } from '../factories/patient-body-metric-validator.factory';

export type PatientBodyMetricProps = {
  storeId: string;
  patientId: string;
  measuredAt: Date;
  weightKg: number;
  heightCm: number;
  bmi: number;
  professionalId: string;
  professionalName: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientBodyMetric extends Entity<PatientBodyMetricProps> {
  constructor(props: PatientBodyMetricProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientBodyMetricValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      PatientBodyMetricProps,
      'professionalId' | 'notes' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): PatientBodyMetric {
    const now = new Date();
    return new PatientBodyMetric(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        measuredAt: props.measuredAt,
        weightKg: props.weightKg,
        heightCm: props.heightCm,
        bmi: props.bmi,
        professionalId: props.professionalId ?? '',
        professionalName: props.professionalName,
        notes: props.notes ?? '',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  withUpdated(input: {
    measuredAt: Date;
    weightKg: number;
    heightCm: number;
    bmi: number;
    professionalId: string;
    professionalName: string;
    notes: string;
  }): PatientBodyMetric {
    return PatientBodyMetric.create(
      {
        ...this.props,
        measuredAt: input.measuredAt,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        bmi: input.bmi,
        professionalId: input.professionalId,
        professionalName: input.professionalName,
        notes: input.notes,
        createdAt: this.props.createdAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get measuredAt(): Date {
    return this.props.measuredAt;
  }

  get weightKg(): number {
    return this.props.weightKg;
  }

  get heightCm(): number {
    return this.props.heightCm;
  }

  get bmi(): number {
    return this.props.bmi;
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get professionalName(): string {
    return this.props.professionalName;
  }

  get notes(): string {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
