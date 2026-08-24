import { z } from "zod";

export const eventSchema = z
  .object({
    user: z.string(),
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    startDate: z.date("Data de início é obrigatória"),
    startTime: z.object(
      { hour: z.number(), minute: z.number() },
      "Hora de início é obrigatória"
    ),
    endDate: z.date("Data de término é obrigatória"),
    endTime: z.object(
      { hour: z.number(), minute: z.number() },
      "Hora de término é obrigatória"
    ),
    color: z.enum(
      ["blue", "green", "red", "yellow", "purple", "orange", "gray"],
      "Cor é obrigatória"
    ),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);

      const endDateTime = new Date(data.endDate);
      endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);

      return startDateTime < endDateTime;
    },
    {
      message: "A data de início não pode ser posterior à data de término",
      path: ["startDate"],
    }
  );

export type TEventFormData = z.infer<typeof eventSchema>;
