export const CLINIC_PLAN_LOCATION_UI_TYPES = [
  'tooth',
  'face_region',
  'body_region',
  'session',
  'none',
] as const;

export type ClinicPlanLocationUiType = (typeof CLINIC_PLAN_LOCATION_UI_TYPES)[number];
