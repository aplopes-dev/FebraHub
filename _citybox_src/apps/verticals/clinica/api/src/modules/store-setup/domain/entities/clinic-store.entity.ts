import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type ClinicStoreProps = {
  storeId: string;
  tradeName: string;
  legalName: string | null;
  slug: string;
  vertical: string;
  document: string | null;
  stateRegistration: string | null;
  usesClientDocument: boolean;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  timezone: string;
  platformUpdatedAt: Date;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type CreateClinicStoreProps = Optional<
  ClinicStoreProps,
  'createdAt' | 'updatedAt' | 'syncedAt'
>;

export class ClinicStore extends Entity<ClinicStoreProps> {
  constructor(props: ClinicStoreProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Espelho cadastral — validação leve; fonte de verdade é a platform-api.
  }

  public static create(props: CreateClinicStoreProps): ClinicStore {
    const now = new Date();
    return new ClinicStore(
      {
        ...props,
        syncedAt: props.syncedAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      props.storeId,
    );
  }

  public static with(props: ClinicStoreProps): ClinicStore {
    return new ClinicStore(props, props.storeId);
  }

  get storeId() {
    return this.props.storeId;
  }
  get tradeName() {
    return this.props.tradeName;
  }
  get legalName() {
    return this.props.legalName;
  }
  get slug() {
    return this.props.slug;
  }
  get vertical() {
    return this.props.vertical;
  }
  get document() {
    return this.props.document;
  }
  get stateRegistration() {
    return this.props.stateRegistration;
  }
  get usesClientDocument() {
    return this.props.usesClientDocument;
  }
  get zipCode() {
    return this.props.zipCode;
  }
  get street() {
    return this.props.street;
  }
  get number() {
    return this.props.number;
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
  get phone() {
    return this.props.phone;
  }
  get timezone() {
    return this.props.timezone;
  }
  get platformUpdatedAt() {
    return this.props.platformUpdatedAt;
  }
  get syncedAt() {
    return this.props.syncedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
