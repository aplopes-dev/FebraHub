import { Ability, type AbilityClass } from '@casl/ability';
import type { Actions } from './actions.js';

/** Recursos protegidos do Beautiful (entidades de domínio, não telas). */
export type Subjects =
  | 'Vertical'
  | 'Settings'
  | 'Team'
  | 'Category'
  | 'Client'
  | 'Service'
  | 'Product'
  | 'Stock'
  | 'Schedule'
  | 'Financial'
  | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export type AppAbilityClass = AbilityClass<AppAbility>;
