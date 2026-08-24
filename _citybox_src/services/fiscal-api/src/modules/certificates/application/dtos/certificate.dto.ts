export type UploadCertificateDto = {
  companyId: string;
  buffer: Buffer;
  filename: string;
  password: string;
  name?: string | null;
};

export type ListCertificatesDto = {
  companyId: string;
};

export type ActivateCertificateDto = {
  certificateId: string;
};

export type GetCertificateStatusDto = {
  certificateId: string;
};
