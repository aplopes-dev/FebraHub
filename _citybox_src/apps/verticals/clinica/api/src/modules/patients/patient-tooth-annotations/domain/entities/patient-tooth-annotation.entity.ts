import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { PatientToothAnnotationValidatorFactory } from '../factories/patient-tooth-annotation-validator.factory';

export type PatientToothAnnotationProps = {
  storeId: string;
  patientId: string;
  toothNumber: number;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: Date;
};

export class PatientToothAnnotation extends Entity<PatientToothAnnotationProps> {
  constructor(props: PatientToothAnnotationProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientToothAnnotationValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<PatientToothAnnotationProps, 'professionalId' | 'createdAt'>,
    id?: string,
  ): PatientToothAnnotation {
    return new PatientToothAnnotation(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        toothNumber: props.toothNumber,
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

  get toothNumber(): number {
    return this.props.toothNumber;
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
