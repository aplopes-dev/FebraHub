export type ReturnOption =
  | 'none'
  | 'one_month'
  | 'six_months'
  | 'twelve_months'
  | 'custom_date';

export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly';

export type RecurrenceEnd = 'never' | 'on_date';

export type InternalEventAvailability = 'busy' | 'available';

export type InternalEventPrivacy = 'private' | 'public';

export type FitInShift = 'morning' | 'afternoon' | 'any';

export type FitInStatus = 'pending' | 'scheduled' | 'cancelled';

export type ReturnAlertSource = 'auto' | 'manual';

export type AppointmentChannel =
  | 'phone'
  | 'whatsapp'
  | 'in_person'
  | 'online'
  | 'other';

export type InsuranceType = 'private' | 'plan';
