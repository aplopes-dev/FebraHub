import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientReferralOriginSystemKey =
  | 'indicacao'
  | 'indicacao_profissional'
  | 'indicacao_profissional_externo'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'outro';

export const SYSTEM_REFERRAL_ORIGINS: ReadonlyArray<{
  systemKey: PatientReferralOriginSystemKey;
  name: string;
}> = [
  { systemKey: 'indicacao', name: 'Indicado por outro paciente' },
  {
    systemKey: 'indicacao_profissional',
    name: 'Indicado por outro profissional da equipe',
  },
  {
    systemKey: 'indicacao_profissional_externo',
    name: 'Indicado por outro profissional externo',
  },
  { systemKey: 'google', name: 'Google' },
  { systemKey: 'instagram', name: 'Instagram' },
  { systemKey: 'facebook', name: 'Facebook' },
  { systemKey: 'outro', name: 'Outro' },
] as const;

export type PatientReferralOriginProps = {
  storeId: string;
  name: string;
  systemKey: PatientReferralOriginSystemKey | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientReferralOrigin extends Entity<PatientReferralOriginProps> {
  constructor(props: PatientReferralOriginProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Validated in use cases.
  }

  public static create(
    props: Optional<
      PatientReferralOriginProps,
      'systemKey' | 'isSystem' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): PatientReferralOrigin {
    return new PatientReferralOrigin(
      {
        storeId: props.storeId,
        name: props.name.trim(),
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: PatientReferralOriginProps,
    id: string,
  ): PatientReferralOrigin {
    return new PatientReferralOrigin(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
