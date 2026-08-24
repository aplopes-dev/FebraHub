import { MOCK_PATIENT_CATEGORIES } from '../data/mock-patient-categories';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';

type Listener = () => void;

let categories: PatientCategory[] = [...MOCK_PATIENT_CATEGORIES];
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getPatientCategoriesSnapshot(): PatientCategory[] {
  return categories;
}

export function subscribePatientCategories(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addPatientCategory(input: PatientCategoryInput): PatientCategory {
  const category: PatientCategory = {
    id: `patient-category-${Date.now()}`,
    name: input.name.trim(),
    colorId: input.colorId,
    isProtected: false,
  };

  categories = [...categories, category];
  notifyListeners();
  return category;
}

export function updatePatientCategory(
  id: string,
  input: PatientCategoryInput,
): PatientCategory | null {
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return null;

  const updated: PatientCategory = {
    ...categories[index],
    name: input.name.trim(),
    colorId: input.colorId,
    isProtected: categories[index].isProtected,
  };

  categories = categories.map((category) => (category.id === id ? updated : category));
  notifyListeners();
  return updated;
}

export function deletePatientCategory(id: string): boolean {
  const next = categories.filter((category) => category.id !== id);
  if (next.length === categories.length) return false;

  categories = next;
  notifyListeners();
  return true;
}

export function resetPatientCategoriesForTests(): void {
  categories = [...MOCK_PATIENT_CATEGORIES];
  notifyListeners();
}
