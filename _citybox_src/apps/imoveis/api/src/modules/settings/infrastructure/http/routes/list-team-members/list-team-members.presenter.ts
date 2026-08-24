import type { TeamMemberEntity } from '../../../../domain/entities/team-member.entity';
import { mapTeamMemberToHttp } from '../shared/team-member-response.mapper';

export class ListTeamMembersPresenter {
  static toHttp(members: readonly TeamMemberEntity[]) {
    return { data: members.map(mapTeamMemberToHttp) };
  }
}
