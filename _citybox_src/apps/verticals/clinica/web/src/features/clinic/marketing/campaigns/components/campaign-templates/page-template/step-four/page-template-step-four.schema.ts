import { z } from "zod";
import { parseLocalDateString } from "@/features/clinic/agenda/lib/local-date";

const pageStrategyStepFourSchemaBase = z.object({
  // Status e Período
  statusType: z.enum(["always_active", "period", "limit"]),
  endDate: z.string().optional(),
  leadLimit: z.number().optional(),
});

export const pageStrategyStepFourSchema = pageStrategyStepFourSchemaBase
  .refine(
    (data) => {
      // Se statusType é "period", endDate é obrigatório e deve ser data futura (não hoje)
      if (data.statusType === "period") {
        if (!data.endDate) {
          return false;
        }
        const end = parseLocalDateString(data.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return end > today;
      }
      return true;
    },
    {
      message: "Data final deve ser uma data futura",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // Se statusType é "limit", leadLimit é obrigatório e > 0
      if (data.statusType === "limit") {
        return data.leadLimit !== undefined && data.leadLimit > 0;
      }
      return true;
    },
    {
      message: "Limite de leads deve ser maior que zero",
      path: ["leadLimit"],
    }
  );

export type PageStrategyStepFourFormData = z.infer<typeof pageStrategyStepFourSchema>;
