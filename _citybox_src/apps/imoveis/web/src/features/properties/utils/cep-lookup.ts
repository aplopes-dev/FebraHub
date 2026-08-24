export type CepAddressDto = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export class CepLookupError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CepLookupError';
  }
}

export function cepDigits(cep: string): string {
  return cep.replace(/\D/g, '');
}

export function isValidCepDigits(digits: string): boolean {
  return digits.length === 8;
}

export async function fetchAddressByCep(cep: string): Promise<CepAddressDto> {
  const digits = cep.replace(/\D/g, '');
  const res = await fetch(`/api/cep/${digits}`);
  if (!res.ok) {
    let message = 'Não foi possível consultar o CEP.';
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // keep generic
    }
    throw new CepLookupError(res.status, message);
  }
  const body = (await res.json()) as { data: CepAddressDto };
  return body.data;
}

export async function geocodeAddress(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (q.length < 3) return null;
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { lat: number; lng: number } };
  if (
    typeof body.data?.lat !== 'number' ||
    typeof body.data?.lng !== 'number'
  ) {
    return null;
  }
  return body.data;
}
