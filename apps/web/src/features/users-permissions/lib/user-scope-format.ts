import type { PlatformUser } from "@/features/users-permissions/types/user";
import { functionalRoleLabel } from "@/features/users-permissions/lib/functional-roles";
import { platformRoleLabel } from "@/features/users-permissions/lib/platform-roles";
import { sectorLabel } from "@/features/users-permissions/lib/sectors";

export function formatUserFunctionalRole(user: PlatformUser): string {
  return functionalRoleLabel(user.functionalRole);
}

/**
 * Papel na plataforma só quando ele diz algo: `MEMBER` é o caso comum e
 * repeti-lo em toda linha da lista vira ruído.
 */
export function formatUserPlatformRole(user: PlatformUser): string | null {
  return user.role === "MEMBER" ? null : platformRoleLabel(user.role);
}

export function formatUserSector(user: PlatformUser): string {
  return sectorLabel(user.sector);
}

/** Extras resumidos para a segunda linha da célula. `null` = só o principal. */
export function formatUserExtraSectors(user: PlatformUser): string | null {
  if (user.extraSectors.length === 0) return null;
  return `+ ${user.extraSectors.map(sectorLabel).join(", ")}`;
}
