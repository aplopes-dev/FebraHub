import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientAnamnesisStatus = 'issued' | 'awaiting_response';
export type PatientAnamnesisSignatureStatus = 'unsigned' | 'pending' | 'signed';
export type PatientAnamnesisFillingMode = 'professional' | 'patient';

export type PatientAnamnesisTriStateAnswer = 'yes' | 'no' | 'unknown';
export type PatientAnamnesisLateralAnswer = 'left' | 'right' | 'unknown';

export type PatientAnamnesisAnswer = {
  questionId: string;
  triState?: PatientAnamnesisTriStateAnswer;
  lateral?: PatientAnamnesisLateralAnswer;
  text?: string;
  auxiliaryText?: string;
  choiceValue?: string;
};

export type PatientAnamnesisQuestionSnapshot = {
  id: string;
  text: string;
  type:
    | 'yes_no_unknown'
    | 'yes_no_unknown_text'
    | 'text'
    | 'left_right_unknown'
    | 'rich_text'
    | 'single_choice';
  generatesAlert?: boolean;
  alertWhen?: 'yes' | 'no';
  alertName?: string;
  auxiliaryText?: string;
  options?: Array<{
    value: string;
    label: string;
    allowsOther?: boolean;
  }>;
};

export type PatientAnamnesisProps = {
  storeId: string;
  patientId: string;
  templateId: string;
  templateName: string;
  issuedAt: Date;
  status: PatientAnamnesisStatus;
  signatureStatus: PatientAnamnesisSignatureStatus;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason: string | null;
  questionsSnapshot: PatientAnamnesisQuestionSnapshot[];
  answers: PatientAnamnesisAnswer[] | null;
  publicToken: string | null;
  linkExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientAnamnesis extends Entity<PatientAnamnesisProps> {
  constructor(props: PatientAnamnesisProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      PatientAnamnesisProps,
      | 'consultationReason'
      | 'answers'
      | 'publicToken'
      | 'linkExpiresAt'
      | 'signatureStatus'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): PatientAnamnesis {
    const now = new Date();
    return new PatientAnamnesis(
      {
        consultationReason: props.consultationReason ?? null,
        answers: props.answers ?? null,
        publicToken: props.publicToken ?? null,
        linkExpiresAt: props.linkExpiresAt ?? null,
        signatureStatus: props.signatureStatus ?? 'unsigned',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        templateId: props.templateId,
        templateName: props.templateName,
        issuedAt: props.issuedAt,
        status: props.status,
        fillingMode: props.fillingMode,
        questionsSnapshot: props.questionsSnapshot,
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

  get templateId(): string {
    return this.props.templateId;
  }

  get templateName(): string {
    return this.props.templateName;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get status(): PatientAnamnesisStatus {
    return this.props.status;
  }

  get signatureStatus(): PatientAnamnesisSignatureStatus {
    return this.props.signatureStatus;
  }

  get fillingMode(): PatientAnamnesisFillingMode {
    return this.props.fillingMode;
  }

  get consultationReason(): string | null {
    return this.props.consultationReason;
  }

  get questionsSnapshot(): PatientAnamnesisQuestionSnapshot[] {
    return this.props.questionsSnapshot;
  }

  get answers(): PatientAnamnesisAnswer[] | null {
    return this.props.answers;
  }

  get publicToken(): string | null {
    return this.props.publicToken;
  }

  get linkExpiresAt(): Date | null {
    return this.props.linkExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withSubmittedAnswers(
    answers: PatientAnamnesisAnswer[],
    consultationReason: string | null,
  ): PatientAnamnesis {
    return PatientAnamnesis.create(
      {
        ...this.props,
        status: 'issued',
        answers,
        consultationReason,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withSignatureStatus(
    signatureStatus: PatientAnamnesisSignatureStatus,
  ): PatientAnamnesis {
    return PatientAnamnesis.create(
      {
        ...this.props,
        signatureStatus,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
