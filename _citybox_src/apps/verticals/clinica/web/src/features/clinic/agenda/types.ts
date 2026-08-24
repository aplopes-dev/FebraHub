// ==================== Calendar View Types ==================== //
export type TCalendarView = "day" | "week" | "month" | "year" | "agenda";
export type TEventColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";
export type TBadgeVariant = "dot" | "colored" | "mixed";
export type TWorkingHours = { [key: number]: { from: number; to: number } };
export type TVisibleHours = {
  from: number;
  to: number;
  fromMinutes: number;
  toMinutes: number;
};

// ==================== Event Types ==================== //
export type TEventType = "appointment" | "commitment";

// Appointment (Consulta)
export type TAppointmentStatus = "scheduled" | "cancelled_patient" | "cancelled_pro" | "in_progress" | "confirmed" | "missed" | "finished" | "patient_waiting";
export type TReturnOption = "none" | "one_month" | "six_months" | "twelve_months" | "custom_date";

// Commitment (Compromisso)
export type TRepeatFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
export type TRepeatEndType = "never" | "on_date";
export type TAvailability = "busy" | "available";
export type TPrivacy = "public" | "private";
