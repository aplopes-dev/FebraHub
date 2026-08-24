import type { AgentProfileEntity } from '../../../settings/domain/entities/agent-profile.entity';
import { DEFAULT_SYSTEM_SETTINGS } from '../../../settings/domain/entities/store-settings.entity';
import {
  initialsFromName,
  type TeamMemberEntity,
} from '../../../settings/domain/entities/team-member.entity';

export type PublicAgentView = {
  storeId: string;
  slug: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  region: string;
  creci: string;
  initials: string;
  hasPhoto: boolean;
  /** StoreSettings — controla o CTA WhatsApp na página pública do imóvel. */
  whatsappCatalogEnabled: boolean;
  /** StoreSettings — controla o formulário de lead na página pública do imóvel. */
  leadFormCatalogEnabled: boolean;
  /** Mesmo accent configurado no sistema principal da loja. */
  accentColorId: string;
};

function pickText(profileValue: string, memberValue: string): string {
  const fromProfile = profileValue.trim();
  if (fromProfile) return fromProfile;
  return memberValue.trim();
}

export function mergePublicAgentView(
  member: TeamMemberEntity,
  profile: AgentProfileEntity | null,
  options: {
    whatsappCatalogEnabled?: boolean;
    leadFormCatalogEnabled?: boolean;
    accentColorId?: string;
  } = {},
): PublicAgentView {
  const name = pickText(profile?.name ?? '', member.name);
  return {
    storeId: member.storeId,
    slug: member.agentId,
    name,
    headline: profile?.role.trim() ?? '',
    email: pickText(profile?.email ?? '', member.email),
    phone: pickText(profile?.phone ?? '', member.phone),
    region: profile?.region.trim() ?? '',
    creci: profile?.stateId.trim() ?? '',
    initials: member.initials || initialsFromName(name),
    hasPhoto: Boolean(profile?.photo),
    whatsappCatalogEnabled: options.whatsappCatalogEnabled ?? true,
    leadFormCatalogEnabled: options.leadFormCatalogEnabled ?? true,
    accentColorId:
      options.accentColorId ?? DEFAULT_SYSTEM_SETTINGS.accentColorId,
  };
}
