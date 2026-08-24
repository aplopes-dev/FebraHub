import { z } from "zod";

const pageStrategySchemaBase = z.object({
    // 1. Identificação
    name: z.string().min(3, "Nome da campanha é obrigatório"),
    formDescription: z.string().optional(),

    // 2. CRM & Funil
    funnelId: z.string().optional(),
    stageId: z.string().optional(),
    ownerId: z.string().optional(),
    notifyOnLead: z.boolean(),
    notificationChannels: z.array(z.string()).optional(),

    // 3. Organização
    tags: z.array(z.string()).optional(),
    duplicityRule: z.enum(["block", "update", "create_new"]),

    // 4. Rastreamento & Ação Final
    fbPixelId: z.string().optional(),
    googleTagId: z.string().optional(),
    successAction: z.enum(["message", "redirect"]),
    successMessage: z.string().optional(),
    redirectUrl: z.string().optional(),
});

export const pageStrategySchema = pageStrategySchemaBase
    .refine(
        (data) => {
            // successMessage é obrigatório se successAction === 'message'
            if (data.successAction === "message" && !data.successMessage) {
                return false;
            }
            return true;
        },
        {
            message: "Mensagem de sucesso é obrigatória",
            path: ["successMessage"],
        }
    )
    .refine(
        (data) => {
            // redirectUrl é obrigatório se successAction === 'redirect'
            if (data.successAction === "redirect" && !data.redirectUrl) {
                return false;
            }
            return true;
        },
        {
            message: "URL de redirecionamento é obrigatória",
            path: ["redirectUrl"],
        }
    )
    .refine(
        (data) => {
            // stageId é obrigatório se funnelId foi selecionado (e não for vazio)
            if (data.funnelId && data.funnelId.trim() !== "" && !data.stageId) {
                return false;
            }
            return true;
        },
        {
            message: "Selecione uma etapa do funil",
            path: ["stageId"],
        }
    );

export type PageStrategyFormData = z.infer<typeof pageStrategySchema>;
