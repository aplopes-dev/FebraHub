import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplate,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';
import type { ClinicAnamnesisSheetSuccessPayload } from '../types/clinic-anamnesis-form';

type ApiEnvelope<T> = { data: T };

type TemplatePayload = {
  name: string;
  status: ClinicAnamnesisTemplate['status'];
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[];
  customQuestions: Array<{
    id?: string;
    text: string;
    type: ClinicAnamnesisQuestion['type'];
    auxiliaryText?: string;
    options?: ClinicAnamnesisQuestion['options'];
    generatesAlert?: boolean;
    alertWhen?: ClinicAnamnesisQuestion['alertWhen'];
    alertName?: string;
  }>;
};

function toCustomQuestionPayload(
  question: ClinicAnamnesisQuestion,
): TemplatePayload['customQuestions'][number] {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    auxiliaryText: question.auxiliaryText,
    options: question.options,
    generatesAlert: question.generatesAlert,
    alertWhen: question.alertWhen,
    alertName: question.alertName,
  };
}

function toTemplatePayload(
  input: Pick<
    ClinicAnamnesisSheetSuccessPayload,
    'name' | 'status' | 'templateQuestions' | 'customQuestions'
  >,
): TemplatePayload {
  return {
    name: input.name.trim(),
    status: input.status,
    templateQuestions: input.templateQuestions.map((item) => ({
      questionId: item.questionId,
      active: item.active,
    })),
    customQuestions: input.customQuestions.map(toCustomQuestionPayload),
  };
}

export async function listAnamnesisTemplates(storeId: string): Promise<ClinicAnamnesisTemplate[]> {
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisTemplate[]>>(
    storeId,
    '/v1/anamnesis-templates',
  );
  return res.data;
}

export async function getAnamnesisTemplate(
  storeId: string,
  templateId: string,
): Promise<ClinicAnamnesisTemplate> {
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisTemplate>>(
    storeId,
    `/v1/anamnesis-templates/${templateId}`,
  );
  return res.data;
}

export async function createAnamnesisTemplate(
  storeId: string,
  input: Pick<
    ClinicAnamnesisSheetSuccessPayload,
    'name' | 'status' | 'templateQuestions' | 'customQuestions'
  >,
): Promise<ClinicAnamnesisTemplate> {
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisTemplate>>(storeId, '/v1/anamnesis-templates', {
    method: 'POST',
    body: JSON.stringify(toTemplatePayload(input)),
  });
  return res.data;
}

export async function updateAnamnesisTemplate(
  storeId: string,
  templateId: string,
  input: Pick<
    ClinicAnamnesisSheetSuccessPayload,
    'name' | 'status' | 'templateQuestions' | 'customQuestions'
  >,
): Promise<ClinicAnamnesisTemplate> {
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisTemplate>>(
    storeId,
    `/v1/anamnesis-templates/${templateId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toTemplatePayload(input)),
    },
  );
  return res.data;
}

export async function updateAnamnesisTemplateStatus(
  storeId: string,
  templateId: string,
  status: ClinicAnamnesisTemplate['status'],
): Promise<ClinicAnamnesisTemplate> {
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisTemplate>>(
    storeId,
    `/v1/anamnesis-templates/${templateId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export async function deleteAnamnesisTemplate(
  storeId: string,
  templateId: string,
): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/anamnesis-templates/${templateId}`, {
    method: 'DELETE',
  });
}

export async function listAnamnesisQuestions(
  storeId: string,
  search?: string,
): Promise<ClinicAnamnesisQuestion[]> {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const res = await clinicaFetch<ApiEnvelope<ClinicAnamnesisQuestion[]>>(
    storeId,
    `/v1/anamnesis-questions${query}`,
  );
  return res.data;
}
