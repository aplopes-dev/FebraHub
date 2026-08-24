import type { PosCustomer } from '../types/customer';

/** Clientes mock do PDV até a API existir. */
export const PLACEHOLDER_CUSTOMERS: readonly PosCustomer[] = [
  {
    id: 'cust-1',
    firstName: 'Ana',
    lastName: 'Souza',
    phone: '73991234567',
    email: 'ana.souza@gmail.com',
    sex: 'female',
    birthDate: '1990-03-12T00:00:00Z',
    address: 'Rua das Palmeiras, 120 — Pontal, Ilhéus/BA',
    memberSince: '2024-02-10T00:00:00Z',
    isMember: true,
    memberExpiresAt: null,
  },
  {
    id: 'cust-2',
    firstName: 'Bruno',
    lastName: 'Silva',
    phone: '73999887766',
    email: 'bruno.silva@gmail.com',
    sex: 'male',
    birthDate: '1985-07-28T00:00:00Z',
    address: 'Av. Soares Lopes, 845 — Centro, Ilhéus/BA',
    memberSince: '2024-04-22T00:00:00Z',
    isMember: false,
    memberExpiresAt: null,
  },
  {
    id: 'cust-3',
    firstName: 'Carla',
    lastName: 'Mendes',
    phone: '7332345678',
    email: 'carla.mendes@hotmail.com',
    sex: 'female',
    birthDate: '1978-11-02T00:00:00Z',
    address: 'Rua Itália, 32 — São Domingos, Ilhéus/BA',
    memberSince: '2023-11-05T00:00:00Z',
    isMember: true,
    memberExpiresAt: '2026-11-05T00:00:00Z',
  },
  {
    id: 'cust-4',
    firstName: 'Diego',
    lastName: 'Oliveira',
    phone: '73988776655',
    email: 'diego.oliveira@gmail.com',
    sex: 'male',
    birthDate: '1996-05-19T00:00:00Z',
    address: 'Alameda das Acácias, 210 — Cidade Nova, Ilhéus/BA',
    memberSince: '2024-06-18T00:00:00Z',
    isMember: false,
    memberExpiresAt: null,
  },
  {
    id: 'cust-5',
    firstName: 'Eduarda',
    lastName: 'Costa',
    phone: '73991112233',
    email: 'eduarda.costa@yahoo.com',
    sex: 'female',
    birthDate: '1967-02-24T00:00:00Z',
    address: 'Rua Marquês de Paranaguá, 78 — Centro, Ilhéus/BA',
    memberSince: '2023-09-14T00:00:00Z',
    isMember: true,
    memberExpiresAt: null,
  },
  {
    id: 'cust-6',
    firstName: 'Felipe',
    lastName: 'Santos',
    phone: '73994445566',
    email: 'felipe.santos@gmail.com',
    sex: 'male',
    birthDate: '2000-09-08T00:00:00Z',
    address: 'Rua Coronel Bastos, 55 — Pontal, Ilhéus/BA',
    memberSince: '2024-01-30T00:00:00Z',
    isMember: false,
    memberExpiresAt: null,
  },
  {
    id: 'cust-7',
    firstName: 'Gabriela',
    lastName: 'Rocha',
    phone: '73995556677',
    email: 'gabriela.rocha@gmail.com',
    sex: 'other',
    birthDate: '1992-12-30T00:00:00Z',
    address: 'Rua Eustáquio Bastos, 410 — Centro, Ilhéus/BA',
    memberSince: '2024-05-02T00:00:00Z',
    isMember: true,
    memberExpiresAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'cust-8',
    firstName: 'Henrique',
    lastName: 'Almeida',
    phone: '73996667788',
    email: 'henrique.almeida@outlook.com',
    sex: 'male',
    birthDate: '1982-04-15T00:00:00Z',
    address: 'Rua Dois de Julho, 189 — São Domingos, Ilhéus/BA',
    memberSince: '2023-12-21T00:00:00Z',
    isMember: false,
    memberExpiresAt: null,
  },
] as const;

export function filterCustomers(
  customers: readonly PosCustomer[],
  query: string,
): PosCustomer[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...customers];

  const digits = normalized.replace(/\D/g, '');

  return customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const phoneMatch =
      digits.length > 0 && customer.phone.replace(/\D/g, '').includes(digits);
    return fullName.includes(normalized) || phoneMatch;
  });
}
