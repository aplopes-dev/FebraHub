import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { EvolutionHistoryValidatorFactory } from '../factories/evolution-history-validator.factory';

export type EvolutionHistoryAction = 'created' | 'edited' | 'confirmed';

export type EvolutionHistoryProps = {
  storeId: string;
  evolutionId: string;
  action: EvolutionHistoryAction;
  professionalId: string | null;
  professionalName: string;
  occurredAt: Date;
  createdAt: Date;
};

export class EvolutionHistory extends Entity<EvolutionHistoryProps> {
  constructor(props: EvolutionHistoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    EvolutionHistoryValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      EvolutionHistoryProps,
      'professionalId' | 'professionalName' | 'createdAt'
    >,
    id?: string,
  ): EvolutionHistory {
    return new EvolutionHistory(
      {
        ...props,
        professionalId: props.professionalId ?? null,
        professionalName: props.professionalName ?? '',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: EvolutionHistoryProps, id: string): EvolutionHistory {
    return new EvolutionHistory(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get evolutionId() {
    return this.props.evolutionId;
  }
  get action() {
    return this.props.action;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get professionalName() {
    return this.props.professionalName;
  }
  get occurredAt() {
    return this.props.occurredAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
