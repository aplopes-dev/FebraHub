import { z } from 'zod';

export const storeMemberSchema = z
  .object({
    firstName: z.string().min(1, 'Informe o primeiro nome').max(100),
    lastName: z.string().min(1, 'Informe o sobrenome').max(100),
    username: z
      .string()
      .min(1, 'Informe o username')
      .max(100)
      .regex(
        /^[a-z0-9._-]+$/,
        'Username: apenas letras minúsculas, números, ponto, hífen ou underscore',
      ),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    role: z.string().min(1, 'Selecione o cargo'),
    permissions: z.string().optional(),
    generateProvisionalPassword: z.boolean(),
    sendInviteEmail: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.generateProvisionalPassword && data.sendInviteEmail) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione apenas senha provisória ou convite por e-mail',
        path: ['sendInviteEmail'],
      });
    }

    if (data.sendInviteEmail && !data.email?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'E-mail é obrigatório para enviar convite',
        path: ['email'],
      });
    }
  });

export type StoreMemberFormData = z.infer<typeof storeMemberSchema>;

export const STORE_MEMBER_DEFAULT_VALUES: StoreMemberFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: '',
  permissions: '',
  generateProvisionalPassword: true,
  sendInviteEmail: false,
};
