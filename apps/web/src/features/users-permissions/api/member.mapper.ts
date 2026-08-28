import type { MemberDto } from "@/features/users-permissions/api/member.dto";
import { functionalRoleIsSeller } from "@/features/users-permissions/lib/functional-roles";
import { isSector } from "@/features/users-permissions/lib/sectors";
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
    functionalRole: dto.functionalRole ?? "VIEWER",
    sector: isSector(dto.sector) ? dto.sector : "geral",
    /* Setor desconhecido (renomeado na API, por exemplo) some da lista em vez
       de virar chip sem rótulo; o principal nunca se repete nos extras. */
    extraSectors: (dto.extraSectors ?? []).filter(
      (item) => isSector(item) && item !== dto.sector,
    ),
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

/** Extras sem duplicata e sem o setor principal — a API recusa repetição. */
function normalizeExtraSectors(values: UserFormValues) {
  return [...new Set(values.extraSectors)].filter(
    (sector) => sector !== values.sector,
  );
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
    functionalRole: values.functionalRole,
    sector: values.sector,
    extraSectors: normalizeExtraSectors(values),
    isSeller: functionalRoleIsSeller(values.functionalRole),
    /* Unidade única: o peso da conta é escolhido na tela (admin / gestor /
       membro), não deduzido de uma hierarquia de matriz/filial que não existe
       mais. */
    role: values.role,
  };
  return payload;
}

export function toUpdateMemberPayload(
  values: UserFormValues,
): UpdateMemberPayload {
  const payload: UpdateMemberPayload = {
    permissionProfileId: values.profileId,
    functionalRole: values.functionalRole,
    sector: values.sector,
    extraSectors: normalizeExtraSectors(values),
    isSeller: functionalRoleIsSeller(values.functionalRole),
    role: values.role,
  };
  return payload;
}
