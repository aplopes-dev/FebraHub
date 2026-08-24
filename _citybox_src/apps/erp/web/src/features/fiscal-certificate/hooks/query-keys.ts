export const fiscalCertificateKeys = {
  all: ["fiscal", "certificates"] as const,
  list: (companyId: string) =>
    [...fiscalCertificateKeys.all, "list", companyId] as const,
  provisioning: ["fiscal", "certificate-provisioning-source"] as const,
};
