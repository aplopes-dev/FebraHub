'use client';

export type CepAddressDto = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type CepAddressEnvelope = {
  data: CepAddressDto;
};

/** Erro de consulta de CEP — a UI usa a mensagem para orientar o preenchimento manual. */
export class CepLookupError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CepLookupError';
  }
}

/**
 * Consulta o CEP no route handler local (`/api/cep/:cep`), que fala com a BrasilAPI.
 * Não passa mais pelo platform-api — ver o comentário no handler.
 */
export async function fetchAddressByCep(cep: string): Promise<CepAddressEnvelope> {
  const digits = cep.replace(/\D/g, '');
  const res = await fetch(`/api/cep/${digits}`);

  if (!res.ok) {
    let message = 'Não foi possível consultar o CEP.';
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // resposta sem corpo JSON — mantém a mensagem genérica
    }
    throw new CepLookupError(res.status, message);
  }

  return (await res.json()) as CepAddressEnvelope;
}
