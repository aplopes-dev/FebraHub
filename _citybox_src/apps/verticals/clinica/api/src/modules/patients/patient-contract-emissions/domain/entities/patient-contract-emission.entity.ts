import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientContractIssuedVia = 'manual';
export type ContractSignatureStatus = 'unsigned' | 'pending' | 'signed';

export type PatientContractFormValues = {
  templateId: string;
  contractorName: string;
  contractorBirthDate: string;
  contractorCpf: string;
  contractorZip: string;
  contractorStreet: string;
  contractorNeighborhood: string;
  contractorCity: string;
  contractorState: string;
  contractedName: string;
  contractedDocument: string;
  contractedCity: string;
  contractValue: string;
  treatmentsDescription: string;
  contractDate: string;
};

export type PatientContractEmissionProps = {
  storeId: string;
  patientId: string;
  budgetId: string | null;
  templateId: string;
  templateName: string;
  content: string;
  issuedAt: Date;
  issuedVia: PatientContractIssuedVia;
  responsibleName: string;
  patientName: string;
  responsibleSignatureStatus: ContractSignatureStatus;
  patientSignatureStatus: ContractSignatureStatus;
  formValues: PatientContractFormValues;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientContractEmission extends Entity<PatientContractEmissionProps> {
  constructor(props: PatientContractEmissionProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      PatientContractEmissionProps,
      | 'budgetId'
      | 'issuedVia'
      | 'responsibleSignatureStatus'
      | 'patientSignatureStatus'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): PatientContractEmission {
    const now = new Date();
    return new PatientContractEmission(
      {
        issuedVia: props.issuedVia ?? 'manual',
        budgetId: props.budgetId ?? null,
        responsibleSignatureStatus:
          props.responsibleSignatureStatus ?? 'unsigned',
        patientSignatureStatus: props.patientSignatureStatus ?? 'unsigned',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        templateId: props.templateId,
        templateName: props.templateName,
        content: props.content,
        issuedAt: props.issuedAt,
        responsibleName: props.responsibleName,
        patientName: props.patientName,
        formValues: props.formValues,
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

  get budgetId(): string | null {
    return this.props.budgetId;
  }

  get templateId(): string {
    return this.props.templateId;
  }

  get templateName(): string {
    return this.props.templateName;
  }

  get content(): string {
    return this.props.content;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get issuedVia(): PatientContractIssuedVia {
    return this.props.issuedVia;
  }

  get responsibleName(): string {
    return this.props.responsibleName;
  }

  get patientName(): string {
    return this.props.patientName;
  }

  get responsibleSignatureStatus(): ContractSignatureStatus {
    return this.props.responsibleSignatureStatus;
  }

  get patientSignatureStatus(): ContractSignatureStatus {
    return this.props.patientSignatureStatus;
  }

  get formValues(): PatientContractFormValues {
    return this.props.formValues;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withUpdatedContent(input: {
    templateId: string;
    templateName: string;
    content: string;
    responsibleName: string;
    patientName: string;
    formValues: PatientContractFormValues;
  }): PatientContractEmission {
    return PatientContractEmission.create(
      {
        ...this.props,
        templateId: input.templateId,
        templateName: input.templateName,
        content: input.content,
        responsibleName: input.responsibleName,
        patientName: input.patientName,
        formValues: input.formValues,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withSignatureStatuses(input: {
    patientSignatureStatus: ContractSignatureStatus;
    responsibleSignatureStatus: ContractSignatureStatus;
  }): PatientContractEmission {
    return PatientContractEmission.create(
      {
        ...this.props,
        patientSignatureStatus: input.patientSignatureStatus,
        responsibleSignatureStatus: input.responsibleSignatureStatus,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
