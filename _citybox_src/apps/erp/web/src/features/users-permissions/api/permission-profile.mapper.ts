import type { PermissionProfileDto } from "@/features/users-permissions/api/permission-profile.dto";
import type {
  PermissionCatalogGroupDto,
  SavePermissionProfilePayload,
} from "@/features/users-permissions/api/permission-profile.dto";
import type {
  PermissionGroup,
  PermissionProfile,
  PermissionProfileFormValues,
} from "@/features/users-permissions/types/permission-profile";

export function toPermissionProfile(dto: PermissionProfileDto): PermissionProfile {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    isSystem: dto.isSystem,
    systemKey: dto.systemKey,
    permissionIds: [...dto.permissionIds],
    deletedAt: dto.deletedAt,
  };
}

export function toSavePermissionProfilePayload(
  values: PermissionProfileFormValues,
): SavePermissionProfilePayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    permissionIds: [...values.permissionIds],
  };
}

export function toPermissionGroups(
  groups: PermissionCatalogGroupDto[],
): PermissionGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    scope: group.scope,
    subgroups: group.subgroups.map((subgroup) => ({
      id: subgroup.id,
      label: subgroup.label,
      items: subgroup.items.map((item) => ({
        id: item.id,
        label: item.label,
      })),
    })),
  }));
}
