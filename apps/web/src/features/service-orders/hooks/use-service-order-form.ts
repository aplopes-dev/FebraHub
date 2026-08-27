"use client";

import { useState } from "react";
import {
  createEmptyServiceOrderFormValues,
  type ServiceOrderFormValues,
} from "@/features/service-orders/lib/service-order-form-values";
import type {
  ServiceOrderBudget,
  ServiceOrderEquipment,
  ServiceOrderLine,
} from "@/features/service-orders/types/service-order";

type UseServiceOrderFormOptions = {
  initialValues?: ServiceOrderFormValues;
  defaultStatusId: string;
};

export function useServiceOrderForm({
  initialValues,
  defaultStatusId,
}: UseServiceOrderFormOptions) {
  const [values, setValues] = useState<ServiceOrderFormValues>(
    () => initialValues ?? createEmptyServiceOrderFormValues(defaultStatusId),
  );

  function setField<K extends keyof ServiceOrderFormValues>(
    key: K,
    value: ServiceOrderFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setBudgetField<K extends keyof ServiceOrderBudget>(
    key: K,
    value: ServiceOrderBudget[K],
  ) {
    setValues((prev) => ({
      ...prev,
      budget: { ...prev.budget, [key]: value },
    }));
  }

  function updateEquipment(id: string, patch: Partial<ServiceOrderEquipment>) {
    setValues((prev) => ({
      ...prev,
      equipments: prev.equipments.map((equipment) =>
        equipment.id === id ? { ...equipment, ...patch } : equipment,
      ),
    }));
  }

  function addEquipment(equipment: ServiceOrderEquipment) {
    setValues((prev) => ({
      ...prev,
      equipments: [...prev.equipments, equipment],
    }));
  }

  function removeEquipment(id: string) {
    setValues((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((equipment) => equipment.id !== id),
    }));
  }

  function updateLine(id: string, patch: Partial<ServiceOrderLine>) {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addLine(line: ServiceOrderLine) {
    setValues((prev) => ({ ...prev, lines: [...prev.lines, line] }));
  }

  function removeLine(id: string) {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== id),
    }));
  }

  return {
    values,
    setField,
    setBudgetField,
    updateEquipment,
    addEquipment,
    removeEquipment,
    updateLine,
    addLine,
    removeLine,
  };
}

export type ServiceOrderForm = ReturnType<typeof useServiceOrderForm>;
