import type {
  AgentProfileEntity,
  LegalDocKind,
} from '../../../../domain/entities/agent-profile.entity';

/** Path relativo autenticado — o web resolve em blob via `imoveisFetchBlob`. */
export function agentProfilePhotoPath(agentId: string): string {
  return `/v1/settings/profile/${encodeURIComponent(agentId)}/photo`;
}

export function agentLegalDocumentPath(
  agentId: string,
  kind: LegalDocKind,
): string {
  return `/v1/settings/profile/${encodeURIComponent(agentId)}/legal-documents/${kind}`;
}

/** Shape HTTP do perfil do corretor (`AgentProfile` no web). */
export function mapAgentProfileToHttp(profile: AgentProfileEntity) {
  return {
    id: profile.agentId,
    name: profile.name,
    role: profile.role,
    email: profile.email,
    phone: profile.phone,
    region: profile.region,
    stateId: profile.stateId,
    taxId: profile.taxId,
    photoUrl: profile.photo
      ? agentProfilePhotoPath(profile.agentId)
      : undefined,
    legalDocuments: profile.legalDocuments.map((doc) => ({
      kind: doc.kind,
      name: doc.name,
      sizeLabel: doc.sizeLabel,
      path: agentLegalDocumentPath(profile.agentId, doc.kind),
    })),
    googleCalendar: {
      connected: profile.googleCalendarConnected,
      enabled: profile.googleCalendarEnabled,
      calendarId: profile.googleCalendarId,
    },
  };
}
