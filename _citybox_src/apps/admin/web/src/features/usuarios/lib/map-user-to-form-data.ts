import type { PlatformUser } from "../types";
import type { AdminUserFormData } from "../schemas/admin-user-schema";
import { ADMIN_USER_DEFAULT_VALUES } from "../schemas/admin-user-schema";

function splitDisplayName(displayName: string | null): { firstName: string; lastName: string } {
  const trimmed = (displayName ?? "").trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}

export function mapUserToFormData(user: PlatformUser): AdminUserFormData {
  const { firstName, lastName } = splitDisplayName(user.displayName);
  return {
    firstName,
    lastName,
    email: user.email ?? "",
    role: user.role,
  };
}

export function getDefaultFormValues(): AdminUserFormData {
  return { ...ADMIN_USER_DEFAULT_VALUES };
}
