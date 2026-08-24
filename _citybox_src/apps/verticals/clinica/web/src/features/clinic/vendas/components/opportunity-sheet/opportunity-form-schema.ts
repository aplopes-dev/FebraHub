import { z } from "zod";

export const opportunityFormSchema = z
  .object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    isLinkedToPatient: z.boolean().optional().default(false),
    patientId: z.string().optional(),
    labelId: z.string().optional(),
    phone: z.string().optional(),
    origin: z.string().optional(),
    nextContact: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.isLinkedToPatient && !data.patientId) return false;
      return true;
    },
    {
      message: "Selecione um paciente",
      path: ["patientId"],
    },
  );

export type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

// Opções de origem
export const ORIGIN_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "site", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "retorno", label: "Retorno" },
  { value: "campaign", label: "Campanha" },
  { value: "budget", label: "Orçamento" },
  { value: "outro", label: "Outro" },
];
