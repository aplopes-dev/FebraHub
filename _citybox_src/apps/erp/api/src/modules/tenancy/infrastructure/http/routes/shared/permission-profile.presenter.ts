import type { PermissionProfile } from '../../../../domain/entities/permission-profile.entity';
import type { ListPermissionProfilesResult } from '../../../../application/dtos/permission-profile.dto';

export class PermissionProfilePresenter {
  static toHttp(profile: PermissionProfile) {
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      isSystem: profile.isSystem,
      systemKey: profile.systemKey,
      permissionIds: profile.permissionIds,
      deletedAt: profile.deletedAt?.toISOString() ?? null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(profile: PermissionProfile) {
    return { data: this.toHttp(profile) };
  }

  static toHttpList(result: ListPermissionProfilesResult) {
    return {
      data: result.items.map((profile) => this.toHttp(profile)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
