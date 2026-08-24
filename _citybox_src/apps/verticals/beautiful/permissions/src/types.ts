import type { Actions } from './actions.js';
import type { Subjects } from './subjects.js';

export interface Permission {
  /** ID estável persistido / listado em papéis (ex.: `settings_team_create`). */
  id: string;
  label: string;
  action: Actions;
  subject: Subjects;
  moduleId: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserPermissions {
  userId: string;
  /** Lista de `Permission.id` efetivos do usuário. */
  permissions: string[];
  /** Bypass total → `can('manage', 'all')`. */
  isOrganizationOwner?: boolean;
  role?: string;
}
