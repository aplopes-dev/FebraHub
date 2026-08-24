import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { notFound } from '../common/envelope.js';

const VIACEP_TIMEOUT_MS = 5000;

interface AddressRow {
  id: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface AddressInput {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

interface ViaCepResponse {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

function toApiAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label,
    zipCode: row.zipCode,
    street: row.street,
    number: row.number,
    complement: row.complement ?? undefined,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    isDefault: row.isDefault,
  };
}

@Injectable()
export class AddressesService {
  private readonly db = getConsumerClient();

  async list(userId: string) {
    const rows = await this.db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return { addresses: rows.map(toApiAddress) };
  }

  async create(userId: string, input: AddressInput) {
    const address = await this.db.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const isDefault = count === 0 ? true : (input.isDefault ?? false);
      if (isDefault && count > 0) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: {
          userId,
          label: input.label,
          zipCode: input.zipCode,
          street: input.street,
          number: input.number,
          complement: input.complement ?? null,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          isDefault,
        },
      });
    });
    return { address: toApiAddress(address) };
  }

  async update(userId: string, addressId: string, input: AddressInput) {
    const existing = await this.db.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw notFound('Endereço não encontrado');

    const address = await this.db.$transaction(async (tx) => {
      const isDefault = input.isDefault ?? existing.isDefault;
      if (isDefault && !existing.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.update({
        where: { id: addressId },
        data: {
          label: input.label,
          zipCode: input.zipCode,
          street: input.street,
          number: input.number,
          complement: input.complement ?? null,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          isDefault,
        },
      });
    });
    return { address: toApiAddress(address) };
  }

  async remove(userId: string, addressId: string) {
    const existing = await this.db.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw notFound('Endereço não encontrado');
    await this.db.address.delete({ where: { id: addressId } });
  }

  async setDefault(userId: string, addressId: string) {
    const existing = await this.db.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw notFound('Endereço não encontrado');

    const address = await this.db.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
    });
    return { address: toApiAddress(address) };
  }

  async lookupZip(zipCode: string) {
    const digits = zipCode.replace(/\D/g, '');
    if (digits.length !== 8) throw notFound('CEP não encontrado');

    let body: ViaCepResponse;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: AbortSignal.timeout(VIACEP_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`viacep status ${res.status}`);
      body = (await res.json()) as ViaCepResponse;
    } catch {
      throw notFound('CEP não encontrado');
    }
    if (body.erro) throw notFound('CEP não encontrado');

    return {
      zipCode: digits.replace(/(\d{5})(\d{3})/, '$1-$2'),
      street: body.logradouro ?? '',
      neighborhood: body.bairro ?? '',
      city: body.localidade ?? '',
      state: body.uf ?? '',
    };
  }
}
