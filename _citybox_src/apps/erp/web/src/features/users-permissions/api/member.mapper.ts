import type { MemberDto } from "@/features/users-permissions/api/member.dto";
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
    branchIds: [...dto.branchIds],
    accessesAllBranches: dto.accessesAllBranches,
    active: dto.active,
    isSeller: dto.isSeller ?? true,
    pdvCode: dto.pdvCode,
    hasPdvPin: dto.hasPdvPin,
    pdvLocked: dto.pdvLocked,
    pdvLockedUntil: dto.pdvLockedUntil,
    pdvPinUpdatedAt: dto.pdvPinUpdatedAt,
    // Settings de e-mails / PDV legados ainda não existem na API — defaults locais.
    settings: createDefaultUserGeneralSettings(),
    isCurrentUser: false,
    deletedAt: dto.active ? null : dto.createdAt,
    createdAt: dto.createdAt,
  };
}

/**
 * Divide o nome completo em first/last para o Keycloak/API.
 *
 * Nome único ("Bruno") → lastName vazio. Duplicar o primeiro nome
 * virava "Bruno Bruno" no join `${first} ${last}` do create-member.
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
  };
  // MEMBER precisa de unidades; OWNER/ADMIN ignoram branchIds na API.
  if (values.branchIds.length > 0) {
    payload.branchIds = [...values.branchIds];
  }
  payload.isSeller = values.isSeller;
  return payload;
}

export function toUpdateMemberPayload(
  values: UserFormValues,
): UpdateMemberPayload {
  const trimmedPdvCode = values.pdvCode.trim();
  const payload: UpdateMemberPayload = {
    permissionProfileId: values.profileId,
    // Vazio → null: remove o código no PUT.
    pdvCode: trimmedPdvCode.length > 0 ? trimmedPdvCode : null,
    isSeller: values.isSeller,
  };
  if (values.branchIds.length > 0) {
    payload.branchIds = [...values.branchIds];
  } else {
    payload.branchIds = [];
  }
  return payload;
}
