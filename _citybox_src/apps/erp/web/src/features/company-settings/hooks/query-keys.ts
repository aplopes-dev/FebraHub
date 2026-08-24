export const organizationCurrentKeys = {
  all: ["organization-current"] as const,
  detail: (organizationId: string) =>
    [...organizationCurrentKeys.all, organizationId] as const,
};
