import { randomUUID } from 'crypto';

export abstract class Entity<T> {
  private readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this.props = props;
    this._id = id ?? randomUUID();
  }

  protected abstract validate(): void;

  get id(): string {
    return this._id;
  }

  public equals(entity: Entity<T>): boolean {
    if (!(entity instanceof Entity)) return false;
    return this._id === entity._id;
  }
}
