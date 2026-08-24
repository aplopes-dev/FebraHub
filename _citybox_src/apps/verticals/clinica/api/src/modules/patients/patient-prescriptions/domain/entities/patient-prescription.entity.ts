import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type { ProfessionalCouncilType } from '../../../../members/domain/professional-council';

export const PRESCRIPTION_MEASURES = [
  'Unidade',
  'Caixa',
  'Frasco',
  'Ampola',
  'Comprimido',
] as const;

export type PrescriptionMeasure = (typeof PRESCRIPTION_MEASURES)[number];

export type PrescriptionItem = {
  id: string;
  name: string;
  quantity: string;
  measure: PrescriptionMeasure;
  posology: string;
  notes: string;
};

export type PatientPrescriptionProps = {
  storeId: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  councilType: ProfessionalCouncilType | null;
  councilNumber: string | null;
  councilUf: string | null;
  patientName: string;
  clinicName: string | null;
  issuedDate: Date;
  issuedAt: Date;
  items: PrescriptionItem[];
  createdAt: Date;
  updatedAt: Date;
};

export class PatientPrescription extends Entity<PatientPrescriptionProps> {
  constructor(props: PatientPrescriptionProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      PatientPrescriptionProps,
      'createdAt' | 'updatedAt' | 'councilType' | 'councilNumber' | 'councilUf'
    >,
    id?: string,
  ): PatientPrescription {
    const now = new Date();
    return new PatientPrescription(
      {
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        professionalId: props.professionalId,
        professionalName: props.professionalName,
        councilType: props.councilType ?? null,
        councilNumber: props.councilNumber ?? null,
        councilUf: props.councilUf ?? null,
        patientName: props.patientName,
        clinicName: props.clinicName,
        issuedDate: props.issuedDate,
        issuedAt: props.issuedAt,
        items: props.items,
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

  get professionalId(): string {
    return this.props.professionalId;
  }

  get professionalName(): string {
    return this.props.professionalName;
  }

  get councilType(): ProfessionalCouncilType | null {
    return this.props.councilType;
  }

  get councilNumber(): string | null {
    return this.props.councilNumber;
  }

  get councilUf(): string | null {
    return this.props.councilUf;
  }

  get patientName(): string {
    return this.props.patientName;
  }

  get clinicName(): string | null {
    return this.props.clinicName;
  }

  get issuedDate(): Date {
    return this.props.issuedDate;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get items(): PrescriptionItem[] {
    return this.props.items;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withUpdatedContent(input: {
    professionalId: string;
    professionalName: string;
    patientName: string;
    clinicName: string | null;
    issuedDate: Date;
    items: PrescriptionItem[];
  }): PatientPrescription {
    return PatientPrescription.create(
      {
        ...this.props,
        professionalId: input.professionalId,
        professionalName: input.professionalName,
        patientName: input.patientName,
        clinicName: input.clinicName,
        issuedDate: input.issuedDate,
        items: input.items,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
