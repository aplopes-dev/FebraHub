import type { MemberDto } from "@/features/users-permissions/api/member.dto";
import { functionalRoleIsSeller } from "@/features/users-permissions/lib/functional-roles";
import {
  createDefaultUserGeneralSettings,
  type PlatformUser,
  type UserFormValues,
} from "@/features/users-permissions/types/user";
import type {
  CreateMemberPayload,
  UpdateMemberPayload,
} from "@/features/users-permissions/api/member.dto";

/**
 * Converte Member da API → PlatformUser da UI.
 * `id` = membershipId; `deletedAt` deriva de `!active` (soft-deactivate).
 * `isCurrentUser` fica false aqui — o caller compara com o e-mail da sessão.
 */
export function toPlatformUser(dto: MemberDto): PlatformUser {
  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    email: dto.email,
    profileId: dto.permissionProfile?.id ?? "",
    role: dto.role,
    scopeLevel: dto.scopeLevel ?? "branch",
    matrixId: dto.matrixId ?? null,
    matrixName: dto.matrixName ?? null,
    functionalRole: dto.functionalRole ?? "VIEWER",
    branchIds: [...(dto.branchIds ?? [])],
    branchNames: [...(dto.branchNames ?? [])],
    accessesAllBranches: dto.accessesAllBranches,
    active: dto.active,
    isSeller: dto.isSeller ?? functionalRoleIsSeller(dto.functionalRole ?? "VIEWER"),
    pdvCode: dto.pdvCode,
    hasPdvPin: dto.hasPdvPin,
    pdvLocked: dto.pdvLocked,
    pdvLockedUntil: dto.pdvLockedUntil,
    pdvPinUpdatedAt: dto.pdvPinUpdatedAt,
    settings: createDefaultUserGeneralSettings(),
    isCurrentUser: false,
    deletedAt: dto.active ? null : dto.createdAt,
    createdAt: dto.createdAt,
  };
}

/**
 * Divide o nome completo em first/last para o Keycloak/API.
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: "" };
  }
  return {
    firstName: trimmed.slice(0, spaceIdx),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  };
}

export function toCreateMemberPayload(
  values: UserFormValues,
): CreateMemberPayload {
  const { firstName, lastName } = splitFullName(values.name);
  const payload: CreateMemberPayload = {
    email: values.email.trim(),
    firstName,
    lastName,
    permissionProfileId: values.profileId,
    scopeLevel: values.scopeLevel,
    matrixId: values.matrixId,
    functionalRole: values.functionalRole,
    isSeller: functionalRoleIsSeller(values.functionalRole),
  };
  if (values.scopeLevel === "branch" && values.branchIds.length > 0) {
    payload.branchIds = [...values.branchIds];
  }
  if (values.scopeLevel === "group") {
    payload.role = "ADMIN";
  } else if (values.scopeLevel === "matrix") {
    payload.role = "ADMIN";
  } else {
    payload.role = "MEMBER";
  }
  return payload;
}

export function toUpdateMemberPayload(
  values: UserFormValues,
): UpdateMemberPayload {
  const payload: UpdateMemberPayload = {
    permissionProfileId: values.profileId,
    scopeLevel: values.scopeLevel,
    matrixId: values.matrixId,
    functionalRole: values.functionalRole,
    isSeller: functionalRoleIsSeller(values.functionalRole),
    branchIds:
      values.scopeLevel === "branch" ? [...values.branchIds] : [],
  };
  if (values.scopeLevel === "group" || values.scopeLevel === "matrix") {
    payload.role = "ADMIN";
  } else {
    payload.role = "MEMBER";
  }
  return payload;
}
