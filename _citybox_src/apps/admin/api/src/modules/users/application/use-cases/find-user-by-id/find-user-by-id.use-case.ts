import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import type { User } from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export interface FindUserByIdDto {
  id: string;
}

@Injectable()
export class FindUserByIdUseCase implements IUseCase<FindUserByIdDto, User> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ id }: FindUserByIdDto): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(FindUserByIdUseCase.name, id);
    }
    return user;
  }
}
