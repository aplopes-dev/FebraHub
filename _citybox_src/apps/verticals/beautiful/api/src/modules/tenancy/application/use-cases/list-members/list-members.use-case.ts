import { Injectable } from '@nestjs/common';
import {
  MemberRepository,
  type ListMembersFilter,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';

export type ListMembersInput = ListMembersFilter & {
  storeId: string;
};

@Injectable()
export class ListMembersUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(input: ListMembersInput): Promise<MemberRecord[]> {
    const { storeId, ...filter } = input;
    return this.members.listByStoreId(storeId, filter);
  }
}
