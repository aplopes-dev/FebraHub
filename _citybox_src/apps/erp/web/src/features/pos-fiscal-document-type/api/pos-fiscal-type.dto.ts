export type PosDocumentModel = "MODEL_55" | "MODEL_65";

/** `GET /v1/pos-fiscal-settings` (erp-api). `posDocumentModel` null = não configurado. */
export type PosFiscalSettingsDto = {
  id: string;
  posDocumentModel: PosDocumentModel | null;
  updatedByUserId: string | null;
  updatedAt: string;
};

export type PosFiscalSettingsResponseDto = { data: PosFiscalSettingsDto };

/** Corpo do `PUT /v1/pos-fiscal-settings`. */
export type UpsertPosFiscalSettingsPayload = {
  posDocumentModel: PosDocumentModel | null;
};
