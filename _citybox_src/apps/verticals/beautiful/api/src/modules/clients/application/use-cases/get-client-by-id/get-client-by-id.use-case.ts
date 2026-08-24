import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientEntity } from '../../../domain/entities/client.entity';
import { ClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

export interface GetClientByIdInput {
  storeId: string;
  id: string;
}

@Injectable()
export class GetClientByIdUseCase implements IUseCase<
  GetClientByIdInput,
  ClientEntity
> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: GetClientByIdInput): Promise<ClientEntity> {
    const client = await this.clientRepository.findById(
      input.storeId,
      input.id,
    );
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }
    return client;
  }
}
