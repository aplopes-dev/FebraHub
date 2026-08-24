"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useSchedulePermissions } from "@/features/clinic/agenda/hooks/use-schedule-permissions";

export type SchedulingInitialData = {
  id?: string;
  type?: "appointment" | "commitment";
  patientId?: string;
  patientName?: string;
  professionalId?: string;
  categoryId?: string | null;
  /** Nome da categoria (ex.: categoria do paciente) — resolvido para categoryId no sheet. */
  categoryName?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  observation?: string;
  observations?: string;
  _fitInId?: string;
  /** Alerta de retorno que originou o agendamento — removido após criar a consulta. */
  _returnAlertId?: string;
  [key: string]: unknown;
};

type SchedulingSheetContextType = {
  isOpen: boolean;
  initialData: SchedulingInitialData | undefined;
  mode: "create" | "edit";
  openSheet: (data?: SchedulingInitialData, mode?: "create" | "edit") => void;
  closeSheet: () => void;
};

const SchedulingSheetContext = createContext<
  SchedulingSheetContextType | undefined
>(undefined);

type SchedulingSheetProviderProps = {
  children: ReactNode;
};

export function SchedulingSheetProvider({
  children,
}: SchedulingSheetProviderProps) {
  const { canCreateScheduling } = useSchedulePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState<SchedulingInitialData | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<"create" | "edit">("create");

  const openSheet = useCallback(
    (data?: SchedulingInitialData, newMode: "create" | "edit" = "create") => {
      // Só access (ver menu) não basta — exige schedule_attend e/ou create_for_others.
      if (!canCreateScheduling) {
        toast.error(
          newMode === "edit"
            ? "Você não tem permissão para editar agendamentos"
            : "Você não tem permissão para criar agendamentos",
        );
        return;
      }
      setInitialData(data);
      setMode(newMode);
      setIsOpen(true);
    },
    [canCreateScheduling],
  );

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    setInitialData(undefined);
    setMode("create");
  }, []);

  return (
    <SchedulingSheetContext.Provider
      value={{ isOpen, initialData, mode, openSheet, closeSheet }}
    >
      {children}
    </SchedulingSheetContext.Provider>
  );
}

export function useSchedulingSheet() {
  const context = useContext(SchedulingSheetContext);
  if (!context) {
    throw new Error(
      "useSchedulingSheet must be used within a SchedulingSheetProvider"
    );
  }
  return context;
}
