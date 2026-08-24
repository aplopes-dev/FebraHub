import type { CreateUserPayload, UpdateUserPayload } from "../types";
import type { AdminUserFormData } from "../schemas/admin-user-schema";

export function buildCreatePayload(data: AdminUserFormData): CreateUserPayload {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    sendInvite: true,
  };
}

export function buildUpdatePayload(data: AdminUserFormData): UpdateUserPayload {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: data.role,
  };
}
