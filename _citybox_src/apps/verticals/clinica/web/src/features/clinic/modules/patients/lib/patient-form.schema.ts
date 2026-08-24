import { z } from 'zod';
import { isValidCpf, onlyDigits } from './brazilian-document.utils';

function optionalCpfRefine(value: string, ctx: z.RefinementCtx, path: string) {
  const digits = onlyDigits(value);
  if (digits.length === 0) return;
  if (!isValidCpf(digits)) {
    ctx.addIssue({ code: 'custom', message: 'CPF inválido.', path: [path] });
  }
}

const genderSchema = z.union([z.enum(['male', 'female', 'other']), z.literal('')]);

const referralOriginSystemKeySchema = z.union([
  z.enum([
    'indicacao',
    'indicacao_profissional',
    'indicacao_profissional_externo',
    'google',
    'instagram',
    'facebook',
    'outro',
  ]),
  z.literal(''),
]);

export const patientFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do paciente.').max(200),
    gender: genderSchema,
    birthDate: z.string().max(10),
    cpf: z.string().max(14),
    rg: z.string().max(30),
    phone: z.string().max(20),
    referralOriginId: z.string(),
    referralOriginSystemKey: referralOriginSystemKeySchema,
    referredByPatientId: z.string(),
    referredByPatientName: z.string(),
    referredByMemberId: z.string(),
    referredByMemberName: z.string(),
    referredByExternalProfessionalId: z.string(),
    referredByExternalProfessionalName: z.string(),
    categoryId: z.string(),
    guardianName: z.string().max(200),
    guardianBirthDate: z.string().max(10),
    guardianCpf: z.string().max(14),
    guardianPhone: z.string().max(20),
    guardianNotes: z.string().max(500),
    email: z.union([z.string().email('E-mail inválido.'), z.literal('')]),
    landlinePhone: z.string().max(20),
    medicalRecordNumber: z.string().max(60),
    profession: z.string().max(120),
    socialNetwork: z.string().max(200),
    planId: z.string(),
    planNumber: z.string().max(60),
    planHolderName: z.string().max(200),
    planHolderCpf: z.string().max(14),
    zipCode: z.string().max(12),
    street: z.string().max(200),
    streetNumber: z.string().max(20),
    complement: z.string().max(120),
    neighborhood: z.string().max(120),
    city: z.string().max(120),
    state: z.string().max(2),
  })
  .superRefine((data, ctx) => {
    optionalCpfRefine(data.cpf, ctx, 'cpf');
    optionalCpfRefine(data.guardianCpf, ctx, 'guardianCpf');
    optionalCpfRefine(data.planHolderCpf, ctx, 'planHolderCpf');

    if (data.referralOriginSystemKey === 'indicacao' && !data.referredByPatientId.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione o paciente que indicou.',
        path: ['referredByPatientId'],
      });
    }

    if (data.referralOriginSystemKey === 'indicacao_profissional') {
      if (!data.referredByMemberId.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecione o profissional que indicou.',
          path: ['referredByMemberId'],
        });
      }
      if (!data.referredByMemberName.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe o nome do profissional que indicou.',
          path: ['referredByMemberName'],
        });
      }
    }

    if (
      data.referralOriginSystemKey === 'indicacao_profissional_externo' &&
      !data.referredByExternalProfessionalId.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione o profissional externo que indicou.',
        path: ['referredByExternalProfessionalId'],
      });
    }
  });

export type PatientFormSchema = z.infer<typeof patientFormSchema>;
