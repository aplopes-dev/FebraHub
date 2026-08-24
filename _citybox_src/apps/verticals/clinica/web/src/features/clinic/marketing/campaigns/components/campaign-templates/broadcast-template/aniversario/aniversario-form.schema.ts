import { z } from 'zod';

export const DEFAULT_ANIVERSARIO_MESSAGE = `Olá {nome_paciente}! Como está??

A equipe do(a) {nome_clinica} está passando por aqui para te desejar um feliz aniversário!
Que seu dia seja repleto de amor, paz e muitos sorrisos!`;

export const aniversarioStepTwoSchema = z.object({
  planIds: z.array(z.string()),
  specialtyIds: z.array(z.string()),
  genders: z.array(z.enum(['male', 'female', 'other'])),
  messageBody: z.string().trim().min(1, 'Informe o texto da mensagem'),
});

export type AniversarioStepTwoFormData = z.infer<typeof aniversarioStepTwoSchema>;

export const EMPTY_ANIVERSARIO_STEP_TWO: AniversarioStepTwoFormData = {
  planIds: [],
  specialtyIds: [],
  genders: [],
  /** Preenchido no step com o template `birthday` das Configurações WhatsApp. */
  messageBody: '',
};

export const aniversarioStepFourSchema = z.object({
  name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres'),
});

export type AniversarioStepFourFormData = z.infer<typeof aniversarioStepFourSchema>;

export const EMPTY_ANIVERSARIO_STEP_FOUR: AniversarioStepFourFormData = {
  name: 'Aniversariantes',
};
