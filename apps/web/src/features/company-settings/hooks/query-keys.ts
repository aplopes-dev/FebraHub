export const organizationCurrentKeys = {
  all: ["organization-current"] as const,
  detail: (organizationId: string) =>
    [...organizationCurrentKeys.all, organizationId] as const,
};

export const groupCurrentKeys = {
  all: ["group-current"] as const,
  detail: (organizationId: string) =>
    [...groupCurrentKeys.all, organizationId] as const,
};
