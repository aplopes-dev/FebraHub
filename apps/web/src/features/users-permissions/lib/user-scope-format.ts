import type { PlatformUser } from "@/features/users-permissions/types/user";
import { functionalRoleLabel } from "@/features/users-permissions/lib/functional-roles";

export function formatUserFunctionalRole(user: PlatformUser): string {
  return functionalRoleLabel(user.functionalRole);
}
