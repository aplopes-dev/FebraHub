/**
 * Catálogo de papéis da **vertical clínica**.
 *
 * Reexporta de `@citybox/clinica-permissions` — única fonte de verdade de
 * papéis + IDs CASL (ADR PLAT-001 §7).
 */
export {
  CLINIC_ROLES,
  clinicRoleLabel,
  isClinicRole,
  permissionsForRole,
  validatePermissionIds,
  type ClinicRoleKey,
} from '@citybox/clinica-permissions';
