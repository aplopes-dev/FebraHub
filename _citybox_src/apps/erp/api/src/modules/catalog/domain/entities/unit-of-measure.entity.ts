import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export const UNIT_KINDS = [
  'unit',
  'weight',
  'volume',
  'length',
  'area',
] as const;

export type UnitKind = (typeof UNIT_KINDS)[number];

export type UnitOfMeasureProps = {
  organizationId: string;
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces: number;
  active: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateUnitOfMeasureProps = Optional<
  UnitOfMeasureProps,
  | 'decimalPlaces'
  | 'active'
  | 'systemKey'
  | 'isSystem'
  | 'createdAt'
  | 'updatedAt'
>;

export class UnitOfMeasure extends Entity<UnitOfMeasureProps> {
  constructor(props: UnitOfMeasureProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Cadastro de apoio — validação de formato fica no DTO HTTP.
  }

  public static create(
    props: CreateUnitOfMeasureProps,
    id?: string,
  ): UnitOfMeasure {
    return new UnitOfMeasure(
      {
        ...props,
        decimalPlaces: props.decimalPlaces ?? 0,
        active: props.active ?? true,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: UnitOfMeasureProps, id: string): UnitOfMeasure {
    return new UnitOfMeasure(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get abbreviation() {
    return this.props.abbreviation;
  }
  get kind() {
    return this.props.kind;
  }
  get decimalPlaces() {
    return this.props.decimalPlaces;
  }
  get active() {
    return this.props.active;
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

  public update(input: {
    name: string;
    abbreviation: string;
    kind: UnitKind;
    decimalPlaces: number;
    active: boolean;
  }): UnitOfMeasure {
    Object.assign(this.props, {
      name: input.name,
      abbreviation: input.abbreviation,
      kind: input.kind,
      decimalPlaces: input.decimalPlaces,
      active: input.active,
    });
    this.touch();
    return this;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
