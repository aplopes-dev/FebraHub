import type {
  PublicPatientAnamnesisApiDetail,
  SubmitPublicPatientAnamnesisBody,
} from '../types/patient-anamnesis-api';

const PUBLIC_ANAMNESIS_BFF = '/api/public/clinic/anamnesis';

export class PublicPatientAnamnesisError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PublicPatientAnamnesisError';
  }
}

type PublicAnamnesisEnvelope = { data: PublicPatientAnamnesisApiDetail };

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } | string };
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
  } catch {
    // resposta sem corpo JSON
  }
  return `Erro ao carregar anamnese (${res.status})`;
}

export async function getPublicPatientAnamnesisByToken(
  token: string,
): Promise<PublicPatientAnamnesisApiDetail> {
  const res = await fetch(`${PUBLIC_ANAMNESIS_BFF}/${encodeURIComponent(token)}`);

  if (!res.ok) {
    throw new PublicPatientAnamnesisError(res.status, await extractErrorMessage(res));
  }

  const payload = (await res.json()) as PublicAnamnesisEnvelope;
  return payload.data;
}

export async function submitPublicPatientAnamnesis(
  token: string,
  body: SubmitPublicPatientAnamnesisBody,
): Promise<PublicPatientAnamnesisApiDetail> {
  const res = await fetch(`${PUBLIC_ANAMNESIS_BFF}/${encodeURIComponent(token)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new PublicPatientAnamnesisError(res.status, await extractErrorMessage(res));
  }

  const payload = (await res.json()) as PublicAnamnesisEnvelope;
  return payload.data;
}
