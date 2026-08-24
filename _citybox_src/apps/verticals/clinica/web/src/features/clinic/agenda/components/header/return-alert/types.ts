"use client";

export type TReturnAlertPeriod = "1_month" | "6_months" | "12_months" | "specific_date";

export interface IReturnAlert {
  id: string;
  returnDate: string;
  reason: string | null;
  source: "appointment" | "manual";
  createdAt: string;
  patient: {
    id: string;
    name: string;
    phone: string | null;
  };
  professional: {
    id: string;
    name: string;
  };
  appointmentId: string | null;
}

export interface IReturnAlertFormData {
  patientId: string;
  professionalId: string;
  returnPeriod: TReturnAlertPeriod;
  specificDate?: string;
  reason: string;
}

