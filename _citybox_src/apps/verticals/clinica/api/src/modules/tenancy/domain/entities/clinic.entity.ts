import { Entity } from '../../../../shared/core/entity';

export type ClinicStatus = 'active' | 'archived';

export type ClinicProps = {
  organizationId: string;
  name: string;
  slug: string;
  isRoot: boolean;
  status: ClinicStatus;
  legalName: string | null;
  document: string | null;
  stateRegistration: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Unidade operacional real da organização (o consultório físico).
 *
 * A clínica **raiz** nasce junto com a organização e reaproveita como `id` o `store_id`
 * legado — é o que mantém válidas as 49 tabelas que já apontam para esse valor. Clínicas
 * criadas depois, dentro da vertical, recebem uuid normal.
 */
export class Clinic extends Entity<ClinicProps> {
  protected validate(): void {
    if (!this.props.name?.trim()) {
      throw new Error('Clinic requer nome');
    }
    if (!this.props.slug?.trim()) {
      throw new Error('Clinic requer slug');
    }
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get isRoot(): boolean {
    return this.props.isRoot;
  }
  get status(): ClinicStatus {
    return this.props.status;
  }
  get timezone(): string {
    return this.props.timezone;
  }

  rename(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    if (this.props.isRoot) {
      throw new Error('Clínica raiz não pode ser arquivada');
    }
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<ClinicProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<ClinicProps, 'createdAt' | 'updatedAt'>>,
    id?: string,
  ): Clinic {
    return new Clinic(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: ClinicProps, id: string): Clinic {
    return new Clinic(props, id);
  }
}
