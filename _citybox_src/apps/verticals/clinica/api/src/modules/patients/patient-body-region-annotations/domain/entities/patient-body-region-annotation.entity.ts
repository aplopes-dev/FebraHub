import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { PatientBodyRegionAnnotationValidatorFactory } from '../factories/patient-body-region-annotation-validator.factory';

export type PatientBodyRegionAnnotationProps = {
  storeId: string;
  patientId: string;
  bodyRegionId: string;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: Date;
};

export class PatientBodyRegionAnnotation extends Entity<PatientBodyRegionAnnotationProps> {
  constructor(props: PatientBodyRegionAnnotationProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientBodyRegionAnnotationValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      PatientBodyRegionAnnotationProps,
      'professionalId' | 'createdAt'
    >,
    id?: string,
  ): PatientBodyRegionAnnotation {
    return new PatientBodyRegionAnnotation(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        bodyRegionId: props.bodyRegionId,
        content: props.content,
        professionalId: props.professionalId ?? '',
        professionalName: props.professionalName,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get bodyRegionId(): string {
    return this.props.bodyRegionId;
  }

  get content(): string {
    return this.props.content;
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get professionalName(): string {
    return this.props.professionalName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
