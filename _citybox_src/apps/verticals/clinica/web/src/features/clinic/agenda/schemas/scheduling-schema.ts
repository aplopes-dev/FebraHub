import * as z from "zod";

// ==================== Enums ==================== //

export const eventTypeEnum = z.enum(["appointment", "commitment"]);

export const returnOptionEnum = z.enum([
  "none",
  "one_month",
  "six_months",
  "twelve_months",
  "custom_date",
]);

export const repeatFrequencyEnum = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
]);

export const repeatEndTypeEnum = z.enum(["never", "on_date"]);
export const availabilityEnum = z.enum(["busy", "available"]);
export const privacyEnum = z.enum(["public", "private"]);

// ==================== Appointment Schema (Consulta) ==================== //

export const appointmentSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal("appointment"),
    patientId: z.string().min(1, "Paciente é obrigatório"),
    patientName: z.string().optional(),
    professionalId: z.string().min(1, "Profissional é obrigatório"),
    categoryId: z.string().uuid().optional().nullable(),
    date: z.string().min(1, "Data é obrigatória"),
    startTime: z.string().min(1, "Hora de início é obrigatória"),
    durationMinutes: z.number().min(15, "Duração mínima é 15 minutos"),
    observation: z.string().optional(),
    sendWhatsAppConfirmation: z.boolean(),
    returnOption: returnOptionEnum,
    returnDate: z.string().optional(),
    returnReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.returnOption !== "custom_date" || (data.returnDate && data.returnDate.length > 0),
    {
      message: "Data do retorno é obrigatória para período específico",
      path: ["returnDate"],
    }
  );

// ==================== Commitment Schema (Compromisso) ==================== //

export const commitmentSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal("commitment"),
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    professionalId: z.string().min(1, "Profissional é obrigatório"),
    isAllDay: z.boolean(),
    startDate: z.string().min(1, "Data de início é obrigatória"),
    startTime: z.string().optional(),
    endDate: z.string().min(1, "Data de término é obrigatória"),
    endTime: z.string().optional(),
    repeat: z.boolean(),
    repeatFrequency: repeatFrequencyEnum.optional(),
    repeatEndType: repeatEndTypeEnum.optional(),
    repeatEndDate: z.string().optional(),
    availability: availabilityEnum,
    privacy: privacyEnum,
  })
  .refine((data) => data.repeat === false || !!data.repeatFrequency, {
    message: "Frequência de repetição é obrigatória",
    path: ["repeatFrequency"],
  })
  .refine((data) => data.repeat === false || !!data.repeatEndType, {
    message: "Término da repetição é obrigatório",
    path: ["repeatEndType"],
  })
  .refine(
    (data) =>
      data.repeatEndType !== "on_date" ||
      (data.repeatEndDate && data.repeatEndDate.length > 0),
    {
      message: "Data final da repetição é obrigatória",
      path: ["repeatEndDate"],
    }
  );

// ==================== Union Schema ==================== //

export const schedulingSchema = z.discriminatedUnion("type", [
  appointmentSchema,
  commitmentSchema,
]);

// ==================== Types ==================== //

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type CommitmentFormData = z.infer<typeof commitmentSchema>;
export type SchedulingFormData = z.infer<typeof schedulingSchema>;
