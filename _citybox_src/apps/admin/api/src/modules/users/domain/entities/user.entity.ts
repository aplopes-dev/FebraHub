import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { UserValidatorFactory } from '../factories/user-validator.factory';

export type PlatformRole = 'platform_admin' | 'platform_operator';

export type UserProps = {
  keycloakSub: string;
  email: string | null;
  displayName: string | null;
  role: PlatformRole;
  photoKey: string | null;
  photoMimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class User extends Entity<UserProps> {
  constructor(props: UserProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    UserValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt' | 'role'>,
    id?: string,
  ): User {
    return new User(
      {
        ...props,
        role: props.role ?? 'platform_operator',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: UserProps, id: string): User {
    return new User(props, id);
  }

  get keycloakSub() {
    return this.props.keycloakSub;
  }
  get email() {
    return this.props.email;
  }
  get displayName() {
    return this.props.displayName;
  }
  get role() {
    return this.props.role;
  }
  get photoKey() {
    return this.props.photoKey;
  }
  get photoMimeType() {
    return this.props.photoMimeType;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }
}
