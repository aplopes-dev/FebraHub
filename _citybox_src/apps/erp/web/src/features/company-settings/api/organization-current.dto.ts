/** Resposta de `GET /v1/organizations/current` (OrganizationPresenter). */
export type OrganizationPersonType = "PF" | "PJ";

export type OrganizationCurrentDto = {
  id: string;
  personType: OrganizationPersonType;
  document: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  responsible: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
  };
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  /**
   * Loja da plataforma vinculada — necessária para provisionar o Emitente
   * fiscal. `null` quando a organização ainda não foi provisionada por evento
   * da plataforma (ver feature `fiscal-certificate`).
   */
  platformStoreId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationCurrentResponseDto = {
  data: OrganizationCurrentDto;
};

/**
 * Corpo de `PUT /v1/organizations/current`.
 * Documento e tipo de pessoa **não** são editáveis na API.
 * Campo opcional em branco é omitido ("" quebraria `@IsEmail`/tamanhos).
 */
export type UpdateOrganizationCurrentPayload = {
  legalName: string;
  tradeName?: string;
  email: string;
  phone?: string;
  responsibleName: string;
  responsibleDocument?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
};
