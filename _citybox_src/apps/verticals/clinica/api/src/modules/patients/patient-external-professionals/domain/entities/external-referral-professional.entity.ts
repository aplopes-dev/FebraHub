import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type ExternalReferralProfessionalProps = {
  storeId: string;
  name: string;
  phone: string;
  cro: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ExternalReferralProfessional extends Entity<ExternalReferralProfessionalProps> {
  constructor(props: ExternalReferralProfessionalProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Validated in use cases.
  }

  public static create(
    props: Optional<
      ExternalReferralProfessionalProps,
      'phone' | 'cro' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): ExternalReferralProfessional {
    return new ExternalReferralProfessional(
      {
        storeId: props.storeId,
        name: props.name.trim(),
        phone: props.phone?.trim() ?? '',
        cro: props.cro?.trim() ?? '',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: ExternalReferralProfessionalProps,
    id: string,
  ): ExternalReferralProfessional {
    return new ExternalReferralProfessional(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get phone() {
    return this.props.phone;
  }
  get cro() {
    return this.props.cro;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public withUpdated(input: {
    name: string;
    phone: string;
    cro: string;
  }): ExternalReferralProfessional {
    return ExternalReferralProfessional.with(
      {
        storeId: this.props.storeId,
        name: input.name.trim(),
        phone: input.phone,
        cro: input.cro,
        createdAt: this.props.createdAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
