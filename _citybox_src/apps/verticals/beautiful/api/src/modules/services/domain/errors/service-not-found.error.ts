import { AppError } from '../../../../shared/core/errors/app.error';

export class ServiceNotFoundError extends AppError {
  constructor(id: string) {
    super({
      internalMessage: `Service with ID "${id}" was not found.`,
      externalMessage: 'Serviço não encontrado.',
      context: 'Services',
    });
  }
}
