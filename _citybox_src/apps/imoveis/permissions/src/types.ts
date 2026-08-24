import type { Actions } from './actions.js';
import type { Subjects } from './subjects.js';

export interface Permission {
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
  permissions: string[];
  isOrganizationOwner?: boolean;
  role?: string;
}
