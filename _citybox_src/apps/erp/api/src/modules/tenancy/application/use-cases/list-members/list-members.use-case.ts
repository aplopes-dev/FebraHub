import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { resolvePagination } from '../../pagination';
import type { ListMembersDto, ListMembersResult } from '../../dtos/member.dto';

@Injectable()
export class ListMembersUseCase implements IUseCase<
  ListMembersDto,
  ListMembersResult
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(input: ListMembersDto): Promise<ListMembersResult> {
    const criteria = {
      search: input.search,
      activeOnly: input.activeOnly,
      isSeller: input.isSeller,
    };

    const total = await this.membershipRepository.count(
      input.organizationId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.membershipRepository.findAll(
      input.organizationId,
      { ...criteria, skip: pagination.skip, take: pagination.perPage },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
