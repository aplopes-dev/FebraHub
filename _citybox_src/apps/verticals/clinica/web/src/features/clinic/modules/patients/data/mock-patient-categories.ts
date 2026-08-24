import type { PatientCategory } from '../types/patient-category';

export const MOCK_PATIENT_CATEGORIES: PatientCategory[] = [
  { id: 'patient-category-001', name: 'Particular', colorId: '#3b82f6', isProtected: true },
  { id: 'patient-category-002', name: 'Convênio', colorId: '#22c55e', isProtected: false },
  { id: 'patient-category-003', name: 'VIP', colorId: '#a855f7', isProtected: false },
];
