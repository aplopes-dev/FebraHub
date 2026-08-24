import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientFolderProps = {
  storeId: string;
  patientId: string;
  parentId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientFolder extends Entity<PatientFolderProps> {
  constructor(props: PatientFolderProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Validated in use cases.
  }

  static create(
    props: Optional<PatientFolderProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): PatientFolder {
    const now = new Date();
    return new PatientFolder(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        parentId: props.parentId,
        name: props.name,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
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

  get parentId(): string | null {
    return this.props.parentId;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withName(name: string): PatientFolder {
    return PatientFolder.create(
      {
        ...this.props,
        name,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withParentId(parentId: string | null): PatientFolder {
    return PatientFolder.create(
      {
        ...this.props,
        parentId,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
