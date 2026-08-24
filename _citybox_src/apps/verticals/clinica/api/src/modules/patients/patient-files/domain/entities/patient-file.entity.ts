import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientFileKind = 'image' | 'file';

export type PatientFileProps = {
  storeId: string;
  patientId: string;
  folderId: string | null;
  name: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  kind: PatientFileKind;
  createdAt: Date;
};

export class PatientFile extends Entity<PatientFileProps> {
  constructor(props: PatientFileProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Validated in use cases.
  }

  static create(
    props: Optional<PatientFileProps, 'createdAt'>,
    id?: string,
  ): PatientFile {
    return new PatientFile(
      {
        storeId: props.storeId,
        patientId: props.patientId,
        folderId: props.folderId,
        name: props.name,
        objectKey: props.objectKey,
        mimeType: props.mimeType,
        sizeBytes: props.sizeBytes,
        kind: props.kind,
        createdAt: props.createdAt ?? new Date(),
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

  get folderId(): string | null {
    return this.props.folderId;
  }

  get name(): string {
    return this.props.name;
  }

  get objectKey(): string {
    return this.props.objectKey;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get kind(): PatientFileKind {
    return this.props.kind;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  withName(name: string): PatientFile {
    return PatientFile.create({ ...this.props, name }, this.id);
  }

  withFolderId(folderId: string | null): PatientFile {
    return PatientFile.create({ ...this.props, folderId }, this.id);
  }
}
