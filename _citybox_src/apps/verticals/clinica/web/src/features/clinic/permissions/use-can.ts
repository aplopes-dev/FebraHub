'use client';

import type { Actions, Subjects } from '@citybox/clinica-permissions';
import { useAbility } from './use-ability';

export function useCan(action: Actions, subject: Subjects): boolean {
  const ability = useAbility();
  return ability ? ability.can(action, subject) : false;
}
