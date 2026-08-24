import { Ability, type AbilityClass } from '@casl/ability';
import type { Actions } from './actions.js';

/** Recursos protegidos da vertical Imóveis. */
export type Subjects =
  | 'Vertical'
  | 'Lead'
  | 'Property'
  | 'Calendar'
  | 'Transaction'
  | 'Finance'
  | 'Dashboard'
  | 'Settings'
  | 'Team'
  | 'Billing'
  | 'Integration'
  | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export type AppAbilityClass = AbilityClass<AppAbility>;
