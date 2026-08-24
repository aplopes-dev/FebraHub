import { z } from "zod";

export const adminUserSchema = z.object({
  firstName: z.string().min(1, "Informe o primeiro nome").max(100),
  lastName: z.string().min(1, "Informe o sobrenome").max(100),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["platform_admin", "platform_operator"]),
});

export type AdminUserFormData = z.infer<typeof adminUserSchema>;

export const ADMIN_USER_DEFAULT_VALUES: AdminUserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  role: "platform_operator",
};
