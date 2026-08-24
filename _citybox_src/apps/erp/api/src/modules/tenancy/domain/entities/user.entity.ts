import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type UserProps = {
  /** Id do usuário no Keycloak — a chave que liga identidade e autorização. */
  keycloakSub: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateUserProps = Optional<
  UserProps,
  'email' | 'name' | 'avatarUrl' | 'active' | 'createdAt' | 'updatedAt'
>;

/**
 * Identidade local espelhando o Keycloak.
 *
 * Existe para que o ERP possa referenciar pessoas em chaves estrangeiras e
 * guardar o que é dele (vínculos, papéis) sem depender do Keycloak — que fica
 * só com credencial e login. É global: o mesmo usuário pode ser membro de
 * várias organizações.
 */
export class User extends Entity<UserProps> {
  constructor(props: UserProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Todos os campos vêm do Keycloak, já validados na origem; o único
    // obrigatório é o `sub`, garantido pelo unique da tabela.
  }

  public static create(props: CreateUserProps, id?: string): User {
    const now = new Date();
    return new User(
      {
        ...props,
        email: props.email?.trim().toLowerCase() || null,
        name: props.name?.trim() || null,
        avatarUrl: props.avatarUrl ?? null,
        active: props.active ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
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
  get name() {
    return this.props.name;
  }
  get avatarUrl() {
    return this.props.avatarUrl;
  }
  get active() {
    return this.props.active;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
