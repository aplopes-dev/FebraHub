"use client";

export type TFitInShift = "morning" | "afternoon" | "any";
export type TFitInStatus = "pending" | "scheduled" | "cancelled";

export interface IFitIn {
  id: string;
  fitInDate: string | null;
  anyDate: boolean;
  shifts: TFitInShift[];
  planName: string | null;
  observation: string | null;
  isUrgent: boolean;
  status: TFitInStatus;
  appointmentId: string | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string | null };
  professional: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

export interface IFitInFormData {
  patientId: string;
  professionalId?: string;
  categoryId?: string;
  anyDate: boolean;
  fitInDate?: string;
  shifts: TFitInShift[];
  planName?: string;
  observation?: string;
  isUrgent: boolean;
}

export interface IPatientFitInCheck {
  hasPendingFitIn: boolean;
  fitIns: IFitIn[];
}
