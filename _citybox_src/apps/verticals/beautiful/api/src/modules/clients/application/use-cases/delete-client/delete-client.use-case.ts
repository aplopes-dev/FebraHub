import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

export interface DeleteClientInput {
  storeId: string;
  id: string;
}

@Injectable()
export class DeleteClientUseCase implements IUseCase<DeleteClientInput, void> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: DeleteClientInput): Promise<void> {
    const client = await this.clientRepository.findById(
      input.storeId,
      input.id,
    );
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    await this.clientRepository.delete(input.storeId, input.id);
  }
}
