'use client';

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '@/lib/store-context';
import {
  createEmptySpecialty,
  createEmptyTreatment,
  clonePlanSpecialties,
  createEmptySystemSpecialties,
} from '../data/plan-specialty-factories';
import type { PlanSpecialtyItem, PlanTreatmentItem } from '../types/clinic-plan-specialty';

export function useClinicPlanConfigure() {
  const { storeId, accessibleStores } = useStore();
  const clinicStrand = useMemo(
    () => accessibleStores.find((store) => store.id === storeId)?.clinicStrand ?? 'odontologia',
    [accessibleStores, storeId],
  );
  const [specialties, setSpecialties] = useState<PlanSpecialtyItem[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [editingSpecialtyNameId, setEditingSpecialtyNameId] = useState<string | null>(null);

  const selectedSpecialty = useMemo(
    () => specialties.find((specialty) => specialty.id === selectedSpecialtyId) ?? null,
    [selectedSpecialtyId, specialties],
  );

  /** “Não copiar (plano vazio)”: especialidades do catálogo, sem tratamentos. */
  const initializeEmpty = useCallback(() => {
    const nextSpecialties = createEmptySystemSpecialties(clinicStrand);
    setSpecialties(nextSpecialties);
    setSelectedSpecialtyId(nextSpecialties[0]?.id ?? null);
    setEditingSpecialtyNameId(null);
  }, [clinicStrand]);

  const initializeFromSpecialties = useCallback((source: PlanSpecialtyItem[]) => {
    const nextSpecialties = clonePlanSpecialties(source);
    setSpecialties(nextSpecialties);
    setSelectedSpecialtyId(nextSpecialties[0]?.id ?? null);
    setEditingSpecialtyNameId(null);
  }, []);

  const resetConfigure = useCallback(() => {
    setSpecialties([]);
    setSelectedSpecialtyId(null);
    setEditingSpecialtyNameId(null);
  }, []);

  /** Cria especialidade vazia, seleciona e abre edição do nome. Retorna o id (para foco no DOM). */
  const addSpecialty = useCallback((): string => {
    const nextSpecialty = createEmptySpecialty(0);
    // setStates separados — NUNCA setState dentro do updater (Strict Mode / pure updater).
    setSpecialties((current) => [...current, nextSpecialty]);
    setSelectedSpecialtyId(nextSpecialty.id);
    setEditingSpecialtyNameId(nextSpecialty.id);
    return nextSpecialty.id;
  }, []);

  const updateSpecialty = useCallback(
    (specialtyId: string, patch: Partial<Pick<PlanSpecialtyItem, 'name'>>) => {
      setSpecialties((current) =>
        current.map((specialty) =>
          specialty.id === specialtyId ? { ...specialty, ...patch } : specialty,
        ),
      );
    },
    [],
  );

  const clearSpecialtyNameEditing = useCallback(() => {
    setEditingSpecialtyNameId(null);
  }, []);

  const editSpecialty = useCallback((specialtyId: string) => {
    setSelectedSpecialtyId(specialtyId);
    setEditingSpecialtyNameId(specialtyId);
  }, []);

  const removeSpecialty = useCallback((specialtyId: string) => {
    setSpecialties((current) => {
      const next = current.filter((specialty) => specialty.id !== specialtyId);
      setSelectedSpecialtyId((selectedId) =>
        selectedId === specialtyId ? (next[0]?.id ?? null) : selectedId,
      );
      return next;
    });
    setEditingSpecialtyNameId((editingId) => (editingId === specialtyId ? null : editingId));
  }, []);

  const updateSpecialtyTreatments = useCallback(
    (specialtyId: string, updater: (treatments: PlanTreatmentItem[]) => PlanTreatmentItem[]) => {
      setSpecialties((current) =>
        current.map((specialty) =>
          specialty.id === specialtyId
            ? { ...specialty, treatments: updater(specialty.treatments) }
            : specialty,
        ),
      );
    },
    [],
  );

  const addTreatment = useCallback(
    (specialtyId: string): string => {
      const nextTreatment = createEmptyTreatment();
      updateSpecialtyTreatments(specialtyId, (treatments) => [
        ...treatments,
        nextTreatment,
      ]);
      return nextTreatment.id;
    },
    [updateSpecialtyTreatments],
  );

  const updateTreatment = useCallback(
    (
      specialtyId: string,
      treatmentId: string,
      patch: Partial<
        Pick<PlanTreatmentItem, 'name' | 'treatmentValue' | 'treatmentCost' | 'enabled' | 'acceptsFaces'>
      >,
    ) => {
      updateSpecialtyTreatments(specialtyId, (treatments) =>
        treatments.map((treatment) =>
          treatment.id === treatmentId ? { ...treatment, ...patch } : treatment,
        ),
      );
    },
    [updateSpecialtyTreatments],
  );

  const removeTreatment = useCallback(
    (specialtyId: string, treatmentId: string) => {
      updateSpecialtyTreatments(specialtyId, (treatments) =>
        treatments.filter((treatment) => treatment.id !== treatmentId),
      );
    },
    [updateSpecialtyTreatments],
  );

  return {
    specialties,
    selectedSpecialtyId,
    selectedSpecialty,
    /** @deprecated alias — prefer `editingSpecialtyNameId` */
    newlyCreatedSpecialtyId: editingSpecialtyNameId,
    editingSpecialtyNameId,
    setSelectedSpecialtyId,
    initializeEmpty,
    initializeFromSpecialties,
    resetConfigure,
    addSpecialty,
    updateSpecialty,
    editSpecialty,
    removeSpecialty,
    clearNewlyCreatedSpecialty: clearSpecialtyNameEditing,
    clearSpecialtyNameEditing,
    addTreatment,
    updateTreatment,
    removeTreatment,
  };
}
