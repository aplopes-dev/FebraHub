import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type { ProfessionalCouncilType } from '../../../../members/domain/professional-council';
import { PatientCertificateValidatorFactory } from '../factories/patient-certificate-validator.factory';

export type PatientCertificateType = 'days' | 'attendance';

export type PatientCertificateProps = {
  storeId: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  councilType: ProfessionalCouncilType | null;
  councilNumber: string | null;
  councilUf: string | null;
  patientName: string;
  clinicName: string | null;
  type: PatientCertificateType;
  issuedDate: Date;
  issuedAt: Date;
  daysCount: string | null;
  startTime: string | null;
  endTime: string | null;
  cid: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientCertificate extends Entity<PatientCertificateProps> {
  constructor(props: PatientCertificateProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientCertificateValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      PatientCertificateProps,
      | 'clinicName'
      | 'daysCount'
      | 'startTime'
      | 'endTime'
      | 'cid'
      | 'councilType'
      | 'councilNumber'
      | 'councilUf'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): PatientCertificate {
    const now = new Date();
    return new PatientCertificate(
      {
        clinicName: props.clinicName ?? null,
        daysCount: props.daysCount ?? null,
        startTime: props.startTime ?? null,
        endTime: props.endTime ?? null,
        cid: props.cid ?? null,
        councilType: props.councilType ?? null,
        councilNumber: props.councilNumber ?? null,
        councilUf: props.councilUf ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        professionalId: props.professionalId,
        professionalName: props.professionalName,
        patientName: props.patientName,
        type: props.type,
        issuedDate: props.issuedDate,
        issuedAt: props.issuedAt,
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

  get type(): PatientCertificateType {
    return this.props.type;
  }

  get issuedDate(): Date {
    return this.props.issuedDate;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get daysCount(): string | null {
    return this.props.daysCount;
  }

  get startTime(): string | null {
    return this.props.startTime;
  }

  get endTime(): string | null {
    return this.props.endTime;
  }

  get cid(): string | null {
    return this.props.cid;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
