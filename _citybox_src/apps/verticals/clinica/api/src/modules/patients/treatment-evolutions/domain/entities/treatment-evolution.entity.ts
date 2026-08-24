import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { TreatmentEvolutionValidatorFactory } from '../factories/treatment-evolution-validator.factory';

export type TreatmentEvolutionSource = 'treatment' | 'standalone' | 'nutrition_init';
export type EvolutionSignatureStatus = 'unsigned' | 'pending' | 'signed';

export const STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION = 'Evolução avulsa';

export type TreatmentEvolutionProps = {
  storeId: string;
  patientId: string;
  treatmentId: string | null;
  source: TreatmentEvolutionSource;
  description: string;
  valueCents: number | null;
  evolutionNotes: string;
  professionalId: string | null;
  professionalName: string;
  finalizedAt: Date;
  soapSubjective: string | null;
  soapObjective: string | null;
  soapAssessment: string | null;
  soapPlan: string | null;
  cid10Codes: string[] | null;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  confirmationHash: string | null;
  signatureStatus: EvolutionSignatureStatus;
  signatureRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateStandaloneEvolutionInput = {
  professionalId: string;
  professionalName: string;
  finalizedAt: Date;
  evolutionNotes: string;
};

export class TreatmentEvolution extends Entity<TreatmentEvolutionProps> {
  constructor(props: TreatmentEvolutionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    TreatmentEvolutionValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      TreatmentEvolutionProps,
      | 'treatmentId'
      | 'description'
      | 'valueCents'
      | 'evolutionNotes'
      | 'professionalId'
      | 'professionalName'
      | 'soapSubjective'
      | 'soapObjective'
      | 'soapAssessment'
      | 'soapPlan'
      | 'cid10Codes'
      | 'confirmedAt'
      | 'confirmedBy'
      | 'confirmationHash'
      | 'signatureStatus'
      | 'signatureRequestId'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): TreatmentEvolution {
    return new TreatmentEvolution(
      {
        ...props,
        treatmentId: props.treatmentId ?? null,
        description:
          props.description ?? STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
        valueCents: props.valueCents ?? null,
        evolutionNotes: props.evolutionNotes ?? '',
        professionalId: props.professionalId ?? null,
        professionalName: props.professionalName ?? '',
        soapSubjective: props.soapSubjective ?? null,
        soapObjective: props.soapObjective ?? null,
        soapAssessment: props.soapAssessment ?? null,
        soapPlan: props.soapPlan ?? null,
        cid10Codes: props.cid10Codes ?? null,
        confirmedAt: props.confirmedAt ?? null,
        confirmedBy: props.confirmedBy ?? null,
        confirmationHash: props.confirmationHash ?? null,
        signatureStatus: props.signatureStatus ?? 'unsigned',
        signatureRequestId: props.signatureRequestId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: TreatmentEvolutionProps, id: string): TreatmentEvolution {
    return new TreatmentEvolution(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get treatmentId() {
    return this.props.treatmentId;
  }
  get source() {
    return this.props.source;
  }
  get description() {
    return this.props.description;
  }
  get valueCents() {
    return this.props.valueCents;
  }
  get evolutionNotes() {
    return this.props.evolutionNotes;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get professionalName() {
    return this.props.professionalName;
  }
  get finalizedAt() {
    return this.props.finalizedAt;
  }
  get soapSubjective() {
    return this.props.soapSubjective;
  }
  get soapObjective() {
    return this.props.soapObjective;
  }
  get soapAssessment() {
    return this.props.soapAssessment;
  }
  get soapPlan() {
    return this.props.soapPlan;
  }
  get cid10Codes() {
    return this.props.cid10Codes;
  }
  get confirmedAt() {
    return this.props.confirmedAt;
  }
  get confirmedBy() {
    return this.props.confirmedBy;
  }
  get confirmationHash() {
    return this.props.confirmationHash;
  }
  get signatureStatus() {
    return this.props.signatureStatus;
  }
  get signatureRequestId() {
    return this.props.signatureRequestId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get isConfirmed(): boolean {
    return this.props.confirmedAt !== null;
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  updateStandalone(input: UpdateStandaloneEvolutionInput): void {
    this.props.professionalId = input.professionalId;
    this.props.professionalName = input.professionalName;
    this.props.finalizedAt = input.finalizedAt;
    this.props.evolutionNotes = input.evolutionNotes.trim();
    this.touch();
    this.validate();
  }

  markSignaturePending(signatureRequestId: string): void {
    this.props.signatureStatus = 'pending';
    this.props.signatureRequestId = signatureRequestId;
    this.touch();
  }

  markSignatureSigned(confirmedBy: string, confirmationHash: string): void {
    this.props.signatureStatus = 'signed';
    this.props.confirmedAt = new Date();
    this.props.confirmedBy = confirmedBy;
    this.props.confirmationHash = confirmationHash;
    this.touch();
  }

  clearSignatureRequest(): void {
    this.props.signatureStatus = 'unsigned';
    this.props.signatureRequestId = null;
    this.touch();
  }
}
