import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { PatientValidatorFactory } from '../factories/patient-validator.factory';

export type PatientStatus = 'active' | 'inactive';
export type PatientGender = 'male' | 'female' | 'other';

export type PatientProps = {
  storeId: string;
  status: PatientStatus;
  name: string;
  cpf: string | null;
  rg: string;
  birthDate: Date | null;
  gender: PatientGender;
  photoObjectKey: string | null;
  photoMimeType: string | null;
  phone: string;
  landlinePhone: string;
  email: string;
  socialNetwork: string;
  medicalRecordNumber: string;
  referralOriginId: string | null;
  referredByPatientId: string | null;
  referredByMemberId: string | null;
  referredByMemberName: string | null;
  referredByExternalProfessionalId: string | null;
  profession: string;
  categoryId: string;
  guardianName: string;
  guardianBirthDate: Date | null;
  guardianCpf: string | null;
  guardianPhone: string;
  guardianNotes: string;
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  planId: string | null;
  planNumber: string;
  planHolderName: string;
  planHolderCpf: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PatientUpsertInput = Omit<
  PatientProps,
  | 'storeId'
  | 'status'
  | 'photoObjectKey'
  | 'photoMimeType'
  | 'createdAt'
  | 'updatedAt'
>;

export class Patient extends Entity<PatientProps> {
  constructor(props: PatientProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      PatientProps,
      | 'status'
      | 'cpf'
      | 'rg'
      | 'birthDate'
      | 'photoObjectKey'
      | 'photoMimeType'
      | 'phone'
      | 'landlinePhone'
      | 'email'
      | 'socialNetwork'
      | 'medicalRecordNumber'
      | 'referralOriginId'
      | 'referredByPatientId'
      | 'referredByMemberId'
      | 'referredByMemberName'
      | 'referredByExternalProfessionalId'
      | 'profession'
      | 'guardianName'
      | 'guardianBirthDate'
      | 'guardianCpf'
      | 'guardianPhone'
      | 'guardianNotes'
      | 'zipCode'
      | 'street'
      | 'streetNumber'
      | 'complement'
      | 'neighborhood'
      | 'city'
      | 'state'
      | 'planId'
      | 'planNumber'
      | 'planHolderName'
      | 'planHolderCpf'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): Patient {
    return new Patient(
      {
        ...props,
        status: props.status ?? 'active',
        cpf: props.cpf ?? null,
        rg: props.rg ?? '',
        birthDate: props.birthDate ?? null,
        photoObjectKey: props.photoObjectKey ?? null,
        photoMimeType: props.photoMimeType ?? null,
        phone: props.phone ?? '',
        landlinePhone: props.landlinePhone ?? '',
        email: props.email ?? '',
        socialNetwork: props.socialNetwork ?? '',
        medicalRecordNumber: props.medicalRecordNumber ?? '',
        referralOriginId: props.referralOriginId ?? null,
        referredByPatientId: props.referredByPatientId ?? null,
        referredByMemberId: props.referredByMemberId ?? null,
        referredByMemberName: props.referredByMemberName ?? null,
        referredByExternalProfessionalId:
          props.referredByExternalProfessionalId ?? null,
        profession: props.profession ?? '',
        guardianName: props.guardianName ?? '',
        guardianBirthDate: props.guardianBirthDate ?? null,
        guardianCpf: props.guardianCpf ?? null,
        guardianPhone: props.guardianPhone ?? '',
        guardianNotes: props.guardianNotes ?? '',
        zipCode: props.zipCode ?? '',
        street: props.street ?? '',
        streetNumber: props.streetNumber ?? '',
        complement: props.complement ?? '',
        neighborhood: props.neighborhood ?? '',
        city: props.city ?? '',
        state: props.state ?? '',
        planId: props.planId ?? null,
        planNumber: props.planNumber ?? '',
        planHolderName: props.planHolderName ?? '',
        planHolderCpf: props.planHolderCpf ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PatientProps, id: string): Patient {
    return new Patient(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get status() {
    return this.props.status;
  }
  get name() {
    return this.props.name;
  }
  get cpf() {
    return this.props.cpf;
  }
  get rg() {
    return this.props.rg;
  }
  get birthDate() {
    return this.props.birthDate;
  }
  get gender() {
    return this.props.gender;
  }
  get photoObjectKey() {
    return this.props.photoObjectKey;
  }
  get photoMimeType() {
    return this.props.photoMimeType;
  }
  get phone() {
    return this.props.phone;
  }
  get landlinePhone() {
    return this.props.landlinePhone;
  }
  get email() {
    return this.props.email;
  }
  get socialNetwork() {
    return this.props.socialNetwork;
  }
  get medicalRecordNumber() {
    return this.props.medicalRecordNumber;
  }
  get referralOriginId() {
    return this.props.referralOriginId;
  }
  get referredByPatientId() {
    return this.props.referredByPatientId;
  }
  get referredByMemberId() {
    return this.props.referredByMemberId;
  }
  get referredByMemberName() {
    return this.props.referredByMemberName;
  }
  get referredByExternalProfessionalId() {
    return this.props.referredByExternalProfessionalId;
  }
  get profession() {
    return this.props.profession;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get guardianName() {
    return this.props.guardianName;
  }
  get guardianBirthDate() {
    return this.props.guardianBirthDate;
  }
  get guardianCpf() {
    return this.props.guardianCpf;
  }
  get guardianPhone() {
    return this.props.guardianPhone;
  }
  get guardianNotes() {
    return this.props.guardianNotes;
  }
  get zipCode() {
    return this.props.zipCode;
  }
  get street() {
    return this.props.street;
  }
  get streetNumber() {
    return this.props.streetNumber;
  }
  get complement() {
    return this.props.complement;
  }
  get neighborhood() {
    return this.props.neighborhood;
  }
  get city() {
    return this.props.city;
  }
  get state() {
    return this.props.state;
  }
  get planId() {
    return this.props.planId;
  }
  get planNumber() {
    return this.props.planNumber;
  }
  get planHolderName() {
    return this.props.planHolderName;
  }
  get planHolderCpf() {
    return this.props.planHolderCpf;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public update(input: PatientUpsertInput): void {
    Object.assign(this.props, input);
    this.touch();
    this.validate();
  }

  public changeStatus(status: PatientStatus): void {
    this.props.status = status;
    this.touch();
    this.validate();
  }

  public setPhoto(objectKey: string, mimeType: string): void {
    this.props.photoObjectKey = objectKey;
    this.props.photoMimeType = mimeType;
    this.touch();
  }

  public clearPhoto(): void {
    this.props.photoObjectKey = null;
    this.props.photoMimeType = null;
    this.touch();
  }

  public hasPhoto(): boolean {
    return Boolean(this.props.photoObjectKey);
  }
}
