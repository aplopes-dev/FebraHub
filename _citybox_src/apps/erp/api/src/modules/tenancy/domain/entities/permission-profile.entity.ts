import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { assertPermissionIds } from '../../../../shared/infra/http/permissions/permission-catalog';
import { PermissionIdsInvalidError } from '../errors/permission-ids-invalid.error';

export type PermissionProfileProps = {
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  systemKey: string | null;
  permissionIds: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePermissionProfileProps = Optional<
  PermissionProfileProps,
  | 'description'
  | 'isSystem'
  | 'systemKey'
  | 'permissionIds'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

type UpdatePermissionProfileInput = {
  name: string;
  description: string;
  permissionIds: string[];
};

/**
 * Perfil de acesso da organização — conjunto de permissões finas do catálogo.
 *
 * Só o Administrador nasce com `isSystem=true` (não editável/excluível). Os
 * demais perfis do seed são editáveis; a regra vive nos use cases. A entidade
 * só garante que `permissionIds` está no catálogo canônico.
 */
export class PermissionProfile extends Entity<PermissionProfileProps> {
  constructor(props: PermissionProfileProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    this.assertValidPermissionIds(this.props.permissionIds);
  }

  public static create(
    props: CreatePermissionProfileProps,
    id?: string,
  ): PermissionProfile {
    const now = new Date();
    const permissionIds = this.normalizePermissionIds(
      props.permissionIds ?? [],
    );
    return new PermissionProfile(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        description: (props.description ?? '').trim(),
        isSystem: props.isSystem ?? false,
        systemKey: props.systemKey ?? null,
        permissionIds,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(
    props: PermissionProfileProps,
    id: string,
  ): PermissionProfile {
    return new PermissionProfile(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get permissionIds() {
    return this.props.permissionIds;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdatePermissionProfileInput): PermissionProfile {
    const permissionIds = PermissionProfile.normalizePermissionIds(
      input.permissionIds,
    );
    return PermissionProfile.with(
      {
        ...this.props,
        name: input.name.trim(),
        description: input.description.trim(),
        permissionIds,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  softDelete(): PermissionProfile {
    const now = new Date();
    return PermissionProfile.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): PermissionProfile {
    return PermissionProfile.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }

  private static normalizePermissionIds(ids: readonly string[]): string[] {
    try {
      return assertPermissionIds(ids);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Permissões inválidas';
      throw new PermissionIdsInvalidError(message);
    }
  }

  private assertValidPermissionIds(ids: readonly string[]): void {
    PermissionProfile.normalizePermissionIds(ids);
  }
}
