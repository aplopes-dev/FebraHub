import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ServiceRepository } from '../../../domain/repositories/service.repository.interface';
import { ServiceNotFoundError } from '../../../domain/errors/service-not-found.error';

export interface DeleteServiceInput {
  storeId: string;
  id: string;
}

@Injectable()
export class DeleteServiceUseCase implements IUseCase<
  DeleteServiceInput,
  void
> {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: DeleteServiceInput): Promise<void> {
    const service = await this.serviceRepository.findById(
      input.storeId,
      input.id,
    );
    if (!service) {
      throw new ServiceNotFoundError(input.id);
    }

    await this.serviceRepository.delete(input.storeId, input.id);
  }
}
