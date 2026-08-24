import type { ServiceHoursConfig } from './service-hours';
import type { CommissionRule } from './commission';
import type { TeamMemberFormValues } from '@/features/shared/team';

export type TeamMemberSheetFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  /** Mapa id CASL → concedido (editável na aba Permissões). */
  permissionValues: Record<string, boolean>;
  serviceHours: ServiceHoursConfig;
  commissionRules: CommissionRule[];
};

export type TeamMemberSheetFormPatch = Partial<TeamMemberSheetFormData>;

export type TeamMemberSheetValidationErrors = Partial<
  Record<'firstName' | 'lastName' | 'username' | 'email' | 'role', string>
>;

export type TeamMemberSubmitPayload = {
  member: TeamMemberFormValues;
  serviceHours?: ServiceHoursConfig;
  commissionRules?: CommissionRule[];
};
