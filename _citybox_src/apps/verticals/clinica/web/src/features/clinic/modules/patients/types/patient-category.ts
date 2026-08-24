export type PatientCategory = {
  id: string;
  name: string;
  /** Hex `#rrggbb` (ids nomeados legados ainda podem aparecer até normalização). */
  colorId: string;
  isProtected: boolean;
};

export type PatientCategoryInput = {
  name: string;
  colorId: string;
};
