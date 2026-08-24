"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@citybox/ui/atoms";
import { toast } from "sonner";

import { AppointmentSection, CommitmentSection } from "./sections";
import {
  appointmentSchema,
  commitmentSchema,
  type AppointmentFormData,
  type CommitmentFormData,
} from "../schemas/scheduling-schema";
import { useCreateAppointment, useUpdateAppointment } from "../hooks/use-appointments";
import { useCreateCommitment, useUpdateCommitment } from "../hooks/use-commitments";
import { useCategories } from "../hooks/use-categories";
import { useSchedulingSheet, type SchedulingInitialData } from "../contexts/scheduling-sheet-context";
import { buildClinicDateTimeIso } from "@/features/clinic/agenda/lib/clinic-datetime";
import { toastClinicaMutationError } from "@/features/clinic/shared/api";

type PartialSchedulingData = {
  date?: string;
  startTime?: string;
};

type SchedulingFormProps = {
  mode?: "create" | "edit";
  initialData?:
    | AppointmentFormData
    | CommitmentFormData
    | PartialSchedulingData
    | SchedulingInitialData;
  onSubmit?: (data: AppointmentFormData | CommitmentFormData) => void;
};

type SchedulingFormContentProps = {
  mode?: "create" | "edit";
  initialData?:
    | AppointmentFormData
    | CommitmentFormData
    | PartialSchedulingData
    | SchedulingInitialData;
  onSubmit?: (data: AppointmentFormData | CommitmentFormData) => void;
};

const defaultAppointmentValues: AppointmentFormData = {
  type: "appointment",
  patientId: "",
  professionalId: "",
  categoryId: null,
  date: "",
  startTime: "",
  durationMinutes: 30,
  observation: "",
  sendWhatsAppConfirmation: true,
  returnOption: "none",
  returnDate: "",
  returnReason: "",
};

const defaultCommitmentValues: CommitmentFormData = {
  type: "commitment",
  title: "",
  description: "",
  professionalId: "",
  isAllDay: false,
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  repeat: false,
  repeatFrequency: undefined,
  repeatEndType: undefined,
  repeatEndDate: "",
  availability: "busy",
  privacy: "private",
};

function isAppointmentData(
  data: AppointmentFormData | CommitmentFormData | PartialSchedulingData | SchedulingInitialData
): data is AppointmentFormData {
  return "type" in data && data.type === "appointment";
}

function isCommitmentData(
  data: AppointmentFormData | CommitmentFormData | PartialSchedulingData | SchedulingInitialData
): data is CommitmentFormData {
  return "type" in data && data.type === "commitment";
}

function isPartialData(
  data: AppointmentFormData | CommitmentFormData | PartialSchedulingData | SchedulingInitialData
): data is PartialSchedulingData {
  return !("type" in data);
}

function resolveObservation(data: { observation?: string; observations?: string }): string {
  if (typeof data.observation === "string") return data.observation;
  if (typeof data.observations === "string") return data.observations;
  return "";
}

function resolveReturnAlertId(
  initialData?: SchedulingInitialData | AppointmentFormData | CommitmentFormData | PartialSchedulingData,
): string | undefined {
  if (!initialData || !("_returnAlertId" in initialData)) return undefined;
  const id = initialData._returnAlertId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function SchedulingFormContent({
  mode = "create",
  initialData,
  onSubmit,
}: SchedulingFormContentProps) {
  const { closeSheet } = useSchedulingSheet();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const { data: categories = [] } = useCategories();
  const linkedReturnAlertIdRef = useRef<string | undefined>(undefined);

  const [confirmedFitInId, setConfirmedFitInId] = useState<string | undefined>(undefined);
  const [fitInCleared, setFitInCleared] = useState(false);

  useEffect(() => {
    linkedReturnAlertIdRef.current = resolveReturnAlertId(initialData);
  }, [initialData]);

  const categoryNameFromIntent =
    initialData &&
    "categoryName" in initialData &&
    typeof initialData.categoryName === "string"
      ? initialData.categoryName
      : undefined;

  const getAppointmentDefaults = (): AppointmentFormData => {
    if (initialData && isAppointmentData(initialData)) {
      return {
        ...defaultAppointmentValues,
        ...initialData,
        observation: resolveObservation(initialData),
        // Campo one-shot: não persiste na API — na edição começa desligado.
        sendWhatsAppConfirmation:
          mode === "edit"
            ? false
            : (initialData.sendWhatsAppConfirmation ??
              defaultAppointmentValues.sendWhatsAppConfirmation),
      };
    }
    if (initialData && isPartialData(initialData)) {
      return {
        ...defaultAppointmentValues,
        date: initialData.date ?? "",
        startTime: initialData.startTime ?? "",
      };
    }
    return defaultAppointmentValues;
  };

  const appointmentForm = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: getAppointmentDefaults(),
  });

  const commitmentForm = useForm<CommitmentFormData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues:
      initialData && isCommitmentData(initialData)
        ? initialData
        : defaultCommitmentValues,
  });

  useEffect(() => {
    if (initialData && isAppointmentData(initialData)) {
      appointmentForm.reset({
        ...defaultAppointmentValues,
        ...initialData,
        observation: resolveObservation(initialData),
        sendWhatsAppConfirmation:
          mode === "edit"
            ? false
            : (initialData.sendWhatsAppConfirmation ??
              defaultAppointmentValues.sendWhatsAppConfirmation),
      });
      return;
    }

    if (initialData && isPartialData(initialData)) {
      const currentProfessionalId = appointmentForm.getValues("professionalId");
      appointmentForm.reset({
        ...defaultAppointmentValues,
        date: initialData.date ?? "",
        startTime: initialData.startTime ?? "",
        // Não apagar pré-preenchimento do profissional (efeito do filho roda antes).
        professionalId: currentProfessionalId || "",
      });
      return;
    }

    if (initialData && isCommitmentData(initialData)) {
      commitmentForm.reset(initialData);
    }
  }, [initialData, appointmentForm, commitmentForm, mode]);

  useEffect(() => {
    if (!categoryNameFromIntent || categories.length === 0) return;

    const match = categories.find(
      (category) =>
        category.name.localeCompare(categoryNameFromIntent, "pt-BR", {
          sensitivity: "accent",
        }) === 0,
    );

    if (match && appointmentForm.getValues("categoryId") !== match.id) {
      appointmentForm.setValue("categoryId", match.id, { shouldValidate: false });
    }
  }, [categoryNameFromIntent, categories, appointmentForm]);

  function handleAppointmentSubmit(data: AppointmentFormData) {
    const dateTime =
      data.date && data.startTime
        ? buildClinicDateTimeIso(data.date, data.startTime)
        : data.date;

    const fitInId = fitInCleared
      ? undefined
      : confirmedFitInId ??
        (initialData && "type" in initialData && initialData.type === "appointment"
          ? (initialData as { _fitInId?: string })._fitInId ?? undefined
          : undefined);

    const returnAlertId = linkedReturnAlertIdRef.current;

    const payload = {
      patientId: data.patientId,
      professionalId: data.professionalId,
      categoryId: data.categoryId ?? null,
      date: dateTime,
      durationMin: data.durationMinutes,
      observations: data.observation || null,
      returnOption: data.returnOption,
      returnDate: data.returnDate || null,
      returnReason: data.returnOption !== "none" ? (data.returnReason || null) : null,
      ...(fitInId ? { fitInId } : {}),
      ...(returnAlertId ? { returnAlertId } : {}),
    };

    const shouldSendWhatsApp = data.sendWhatsAppConfirmation === true;

    if (mode === "edit" && data.id) {
      updateAppointment.mutate(
        {
          id: data.id,
          data: {
            ...payload,
            ...(shouldSendWhatsApp ? { sendWhatsAppConfirmation: true } : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Consulta atualizada com sucesso");
            appointmentForm.reset(defaultAppointmentValues);
            closeSheet();
            onSubmit?.(data);
          },
          onError: (error) => {
            toastClinicaMutationError(error, "Erro ao atualizar consulta");
          },
        }
      );
    } else {
      createAppointment.mutate(
        {
          ...payload,
          ...(shouldSendWhatsApp ? { sendWhatsAppConfirmation: true } : {}),
        },
        {
          onSuccess: () => {
            linkedReturnAlertIdRef.current = undefined;
            toast.success("Consulta criada com sucesso");
            appointmentForm.reset(defaultAppointmentValues);
            closeSheet();
            onSubmit?.(data);
          },
          onError: (error) => {
            toastClinicaMutationError(error, "Erro ao criar consulta");
          },
        }
      );
    }
  }

  function handleCommitmentSubmit(data: CommitmentFormData) {
    const buildDateTime = (date: string, time?: string) => {
      if (!time) return `${date}T00:00:00.000Z`;
      return buildClinicDateTimeIso(date, time);
    };

    const payload = {
      professionalId: data.professionalId,
      title: data.title,
      description: data.description || null,
      allDay: data.isAllDay,
      startDate: buildDateTime(data.startDate, data.isAllDay ? undefined : data.startTime),
      endDate: buildDateTime(data.endDate, data.isAllDay ? undefined : data.endTime),
      recurring: data.repeat,
      recurrenceType: data.repeat ? data.repeatFrequency ?? null : null,
      recurrenceEnd: data.repeat ? data.repeatEndType ?? null : null,
      recurrenceEndDate: data.repeatEndType === "on_date" ? data.repeatEndDate || null : null,
      availability: data.availability,
      privacy: data.privacy,
    };

    const toastCommitmentSuccess = (
      baseMessage: string,
      displacedCount: number | undefined,
    ) => {
      if (displacedCount && displacedCount > 0) {
        const noun =
          displacedCount === 1
            ? "consulta foi enviada"
            : `${displacedCount} consultas foram enviadas`;
        toast.success(
          `${baseMessage}. ${noun} para Gestão de Encaixe.`,
        );
        return;
      }
      toast.success(baseMessage);
    };

    if (mode === "edit" && data.id) {
      updateCommitment.mutate(
        { id: data.id, data: payload },
        {
          onSuccess: (result) => {
            toastCommitmentSuccess(
              "Compromisso atualizado com sucesso",
              result.displacedAppointments?.length,
            );
            commitmentForm.reset(defaultCommitmentValues);
            closeSheet();
            onSubmit?.(data);
          },
          onError: (error) => {
            toastClinicaMutationError(error, "Erro ao atualizar compromisso");
          },
        }
      );
    } else {
      createCommitment.mutate(payload, {
        onSuccess: (result) => {
          toastCommitmentSuccess(
            "Compromisso criado com sucesso",
            result.displacedAppointments?.length,
          );
          commitmentForm.reset(defaultCommitmentValues);
          closeSheet();
          onSubmit?.(data);
        },
        onError: (error) => {
          toastClinicaMutationError(error, "Erro ao criar compromisso");
        },
      });
    }
  }

  const hasInitialDateTime = !!(
    initialData &&
    isPartialData(initialData) &&
    initialData.date &&
    initialData.startTime
  );

  const initialFitInId =
    initialData && "type" in initialData && initialData.type === "appointment"
      ? (initialData as { _fitInId?: string })._fitInId ?? undefined
      : undefined;

  const linkedFitInId = fitInCleared
    ? undefined
    : confirmedFitInId ?? initialFitInId;

  const handleFitInClear = () => {
    setConfirmedFitInId(undefined);
    setFitInCleared(true);
  };

  return (
    <>
      <TabsContent value="appointment" className="mt-0">
        <FormProvider {...appointmentForm}>
          <form
            id="scheduling-form"
            onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)}
          >
            <AppointmentSection
              form={appointmentForm}
              hasInitialDateTime={hasInitialDateTime}
              initialData={initialData}
              onFitInConfirm={(id) => {
                setFitInCleared(false);
                setConfirmedFitInId(id);
              }}
              linkedFitInId={linkedFitInId}
              onFitInClear={handleFitInClear}
            />
          </form>
        </FormProvider>
      </TabsContent>

      <TabsContent value="commitment" className="mt-0">
        <FormProvider {...commitmentForm}>
          <form
            id="scheduling-form"
            onSubmit={commitmentForm.handleSubmit(handleCommitmentSubmit)}
          >
            <CommitmentSection form={commitmentForm} />
          </form>
        </FormProvider>
      </TabsContent>
    </>
  );
}

export function SchedulingForm({
  mode = "create",
  initialData,
  onSubmit,
}: SchedulingFormProps) {
  const initialType =
    initialData && "type" in initialData ? initialData.type : "appointment";

  const appointmentLabel =
    mode === "create" ? "Nova Consulta" : "Editar Consulta";
  const commitmentLabel =
    mode === "create" ? "Novo Compromisso" : "Editar Compromisso";

  const tabsTriggerClassName =
    "rounded-full border px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground";

  return (
    <Tabs defaultValue={initialType} className="w-full">
      <div className="mb-6">
        <TabsList className="h-auto gap-2 bg-transparent p-0 justify-start">
          <TabsTrigger value="appointment" className={tabsTriggerClassName}>
            {appointmentLabel}
          </TabsTrigger>
          <TabsTrigger value="commitment" className={tabsTriggerClassName}>
            {commitmentLabel}
          </TabsTrigger>
        </TabsList>
      </div>

      <SchedulingFormContent
        mode={mode}
        initialData={initialData}
        onSubmit={onSubmit}
      />
    </Tabs>
  );
}
