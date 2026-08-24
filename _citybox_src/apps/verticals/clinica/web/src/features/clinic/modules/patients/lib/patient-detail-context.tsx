'use client';

import { createContext, useContext } from 'react';
import type { ClinicPatient } from '../types/clinic-patient';

type PatientDetailContextValue = {
  patient: ClinicPatient;
};

const PatientDetailContext = createContext<PatientDetailContextValue | null>(null);

type PatientDetailProviderProps = {
  patient: ClinicPatient;
  children: React.ReactNode;
};

export function PatientDetailProvider({ patient, children }: PatientDetailProviderProps) {
  return (
    <PatientDetailContext.Provider value={{ patient }}>{children}</PatientDetailContext.Provider>
  );
}

export function usePatientDetail(): ClinicPatient {
  const context = useContext(PatientDetailContext);
  if (!context) {
    throw new Error('usePatientDetail deve ser usado dentro de PatientDetailProvider.');
  }
  return context.patient;
}
