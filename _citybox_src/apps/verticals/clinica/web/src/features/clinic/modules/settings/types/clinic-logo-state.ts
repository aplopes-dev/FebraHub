export type ClinicLogoImageState = {
  pendingFile: File | null;
  removeExisting: boolean;
};

export const EMPTY_CLINIC_LOGO_STATE: ClinicLogoImageState = {
  pendingFile: null,
  removeExisting: false,
};
