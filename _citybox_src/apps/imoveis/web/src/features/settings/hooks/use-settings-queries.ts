'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  applyAndPersistAccentColor,
  type AccentColorValue,
} from '../data/accent-presets';
import {
  changeAgentPassword,
  completeFirstLoginPassword,
  createTeamMember,
  deleteAgentFolderDocument,
  deleteAgentPhoto,
  deleteLegalDocument,
  deleteTeamMember,
  getAgentPrivacy,
  getAgentProfile,
  getBillingSettings,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  syncPendingGoogleCalendar,
  disconnectGoogleCalendar,
  getStoreSettings,
  getSystemSettings,
  listAgentDocuments,
  listTeamMembers,
  putAgentPrivacy,
  putAgentProfile,
  putStoreNotifications,
  putStoreSettings,
  revokeAgentSession,
  updateSystemSettings,
  updateAgentFolderDocument,
  updateTeamMember,
  uploadAgentFolderDocument,
  uploadAgentPhoto,
  upsertLegalDocument,
  type AgentProfileWriteInput,
  type CreateUserResult,
  type StoreSettingsPayload,
  type UserWriteInput,
} from '../services/settings-service';
import type { DocumentFileStatus, DocumentFolderId, LegalDocKind, TeamUser } from '../types';
import { settingsKeys } from './query-keys';

export function syncAccentColorFromApi(accentColorId: AccentColorValue): void {
  if (typeof window === 'undefined') return;
  const current = getSystemSettings();
  if (current.accentColorId !== accentColorId) {
    updateSystemSettings({ ...current, accentColorId });
  }
  applyAndPersistAccentColor(accentColorId);
}

/** Prefetch store + users no shell — só com loja ativa (evita cache do fallback). */
export function useSettingsBootstrap() {
  const { storeId } = useStore();
  const ready = Boolean(storeId);
  useStoreSettingsQuery(ready);
  useTeamMembersQuery(ready);
}

export function useStoreSettingsQuery(enabled = true) {
  const { storeId } = useStore();
  const query = useQuery({
    queryKey: settingsKeys.store(storeId || '_'),
    queryFn: getStoreSettings,
    enabled: enabled && Boolean(storeId),
  });
  const accentColorId = query.data?.system.accentColorId;
  useEffect(() => {
    if (accentColorId) syncAccentColorFromApi(accentColorId);
  }, [accentColorId]);
  return query;
}

export function useStoreSettingsFromCache(): StoreSettingsPayload | undefined {
  const qc = useQueryClient();
  const { storeId } = useStore();
  if (!storeId) return undefined;
  return qc.getQueryData(settingsKeys.store(storeId));
}

export function usePutStoreSettingsMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (input: StoreSettingsPayload) => putStoreSettings(input),
    onSuccess: (saved) => {
      if (storeId) qc.setQueryData(settingsKeys.store(storeId), saved);
      syncAccentColorFromApi(saved.system.accentColorId);
    },
  });
}

export function usePutStoreNotificationsMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: putStoreNotifications,
    onSuccess: (saved) => {
      if (storeId) qc.setQueryData(settingsKeys.store(storeId), saved);
    },
  });
}

export function useBillingQuery(enabled = true) {
  const { storeId } = useStore();
  return useQuery({
    queryKey: settingsKeys.billing(storeId || '_'),
    queryFn: getBillingSettings,
    enabled: enabled && Boolean(storeId),
  });
}

export function useAgentProfileQuery(agentId: string | undefined, enabled = true) {
  const { storeId } = useStore();
  return useQuery({
    queryKey: settingsKeys.profile(storeId || '_', agentId ?? ''),
    queryFn: () => getAgentProfile(agentId!),
    enabled: Boolean(agentId) && Boolean(storeId) && enabled,
  });
}

export function useGoogleCalendarStatusQuery(enabled = true) {
  return useQuery({
    queryKey: settingsKeys.googleCalendar(),
    queryFn: getGoogleCalendarStatus,
    enabled,
  });
}

export function useConnectGoogleCalendarMutation() {
  return useMutation({
    mutationFn: getGoogleCalendarAuthUrl,
  });
}

export function useDisconnectGoogleCalendarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.googleCalendar() });
      void qc.invalidateQueries({ queryKey: settingsKeys.profiles() });
    },
  });
}

/** Backfill: compromissos CRM sem googleEventId → Google Calendar. */
export function useSyncPendingGoogleCalendarMutation() {
  return useMutation({
    mutationFn: syncPendingGoogleCalendar,
  });
}

export function usePrivacyQuery(agentId: string | undefined, enabled = true) {
  const { storeId } = useStore();
  return useQuery({
    queryKey: settingsKeys.privacy(storeId || '_', agentId ?? ''),
    queryFn: () => getAgentPrivacy(agentId!),
    enabled: Boolean(agentId) && Boolean(storeId) && enabled,
  });
}

export function useDocumentsQuery(
  agentId: string | undefined,
  folderId?: DocumentFolderId,
  enabled = true,
) {
  const { storeId } = useStore();
  return useQuery({
    queryKey: settingsKeys.documents(storeId || '_', agentId ?? '', folderId),
    queryFn: () => listAgentDocuments(agentId!, folderId),
    enabled: Boolean(agentId) && Boolean(storeId) && enabled,
  });
}

export function useTeamMembersQuery(enabled = true) {
  const { storeId } = useStore();
  return useQuery({
    queryKey: settingsKeys.users(storeId || '_'),
    queryFn: listTeamMembers,
    enabled: enabled && Boolean(storeId),
    staleTime: 30_000,
  });
}

function invalidateProfile(
  qc: ReturnType<typeof useQueryClient>,
  storeId: string,
  agentId: string,
) {
  void qc.invalidateQueries({
    queryKey: settingsKeys.profile(storeId, agentId),
  });
}

export function usePutAgentProfileMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; input: AgentProfileWriteInput }) =>
      putAgentProfile(v.agentId, v.input),
    onSuccess: (_s, v) => invalidateProfile(qc, storeId, v.agentId),
  });
}

export function useUploadAgentPhotoMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; file: File }) =>
      uploadAgentPhoto(v.agentId, v.file),
    onSuccess: (saved, v) => {
      qc.setQueryData(settingsKeys.profile(storeId, v.agentId), saved);
    },
  });
}

export function useDeleteAgentPhotoMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string }) => deleteAgentPhoto(v.agentId),
    onSuccess: (saved, v) => {
      qc.setQueryData(settingsKeys.profile(storeId, v.agentId), saved);
    },
  });
}

export function useUpsertLegalDocumentMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; kind: LegalDocKind; file: File }) =>
      upsertLegalDocument(v.agentId, v.kind, v.file),
    onSuccess: (_s, v) => {
      invalidateProfile(qc, storeId, v.agentId);
      void qc.invalidateQueries({
        queryKey: settingsKeys.documentsRoot(storeId, v.agentId),
      });
    },
  });
}

export function useDeleteLegalDocumentMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; kind: LegalDocKind }) =>
      deleteLegalDocument(v.agentId, v.kind),
    onSuccess: (_s, v) => {
      invalidateProfile(qc, storeId, v.agentId);
      void qc.invalidateQueries({
        queryKey: settingsKeys.documentsRoot(storeId, v.agentId),
      });
    },
  });
}

function invalidateDocuments(
  qc: ReturnType<typeof useQueryClient>,
  storeId: string,
  agentId: string,
) {
  void qc.invalidateQueries({
    queryKey: settingsKeys.documentsRoot(storeId, agentId),
  });
}

export function useUploadAgentFolderDocumentMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: {
      agentId: string;
      folderId: DocumentFolderId;
      file: File;
      detailsLabel?: string;
      status?: DocumentFileStatus;
    }) =>
      uploadAgentFolderDocument(v.agentId, v.folderId, v.file, {
        detailsLabel: v.detailsLabel,
        status: v.status,
      }),
    onSuccess: (_s, v) => invalidateDocuments(qc, storeId, v.agentId),
  });
}

export function useUpdateAgentFolderDocumentMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: {
      agentId: string;
      documentId: string;
      detailsLabel?: string;
      status?: DocumentFileStatus;
    }) =>
      updateAgentFolderDocument(v.agentId, v.documentId, {
        detailsLabel: v.detailsLabel,
        status: v.status,
      }),
    onSuccess: (_s, v) => invalidateDocuments(qc, storeId, v.agentId),
  });
}

export function useDeleteAgentFolderDocumentMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; documentId: string }) =>
      deleteAgentFolderDocument(v.agentId, v.documentId),
    onSuccess: (_s, v) => invalidateDocuments(qc, storeId, v.agentId),
  });
}

export function usePutPrivacyMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; twoFactorEnabled: boolean }) =>
      putAgentPrivacy(v.agentId, v.twoFactorEnabled),
    onSuccess: (saved, v) => {
      qc.setQueryData(settingsKeys.privacy(storeId, v.agentId), saved);
    },
  });
}

export function useRevokeSessionMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; sessionId: string }) =>
      revokeAgentSession(v.agentId, v.sessionId),
    onSuccess: (saved, v) => {
      qc.setQueryData(settingsKeys.privacy(storeId, v.agentId), saved);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (v: {
      agentId: string;
      currentPassword: string;
      newPassword: string;
    }) => changeAgentPassword(v.agentId, v.currentPassword, v.newPassword),
  });
}

export function useCreateTeamMemberMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (input: UserWriteInput) => createTeamMember(input),
    onSuccess: (result) => {
      if (!storeId) return;
      const key = settingsKeys.users(storeId);
      qc.setQueryData<readonly TeamUser[]>(key, (prev) => {
        const list = prev ? [...prev] : [];
        if (list.some((m) => m.id === result.user.id)) {
          return list.map((m) => (m.id === result.user.id ? result.user : m));
        }
        return [...list, result.user];
      });
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateTeamMemberMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; input: UserWriteInput }) =>
      updateTeamMember(v.agentId, v.input),
    onSuccess: (updated) => {
      if (!storeId) return;
      const key = settingsKeys.users(storeId);
      qc.setQueryData<readonly TeamUser[]>(key, (prev) =>
        (prev ?? []).map((m) => (m.id === updated.id ? updated : m)),
      );
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export type { CreateUserResult };

export function useDeleteTeamMemberMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (agentId: string) => deleteTeamMember(agentId),
    onSuccess: (_ok, agentId) => {
      if (!storeId) return;
      const key = settingsKeys.users(storeId);
      qc.setQueryData<readonly TeamUser[]>(key, (prev) =>
        (prev ?? []).filter((m) => m.id !== agentId),
      );
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCompleteFirstLoginMutation() {
  const qc = useQueryClient();
  const { storeId } = useStore();
  return useMutation({
    mutationFn: (v: { agentId: string; newPassword: string }) =>
      completeFirstLoginPassword(v.agentId, v.newPassword),
    onSuccess: () => {
      if (!storeId) return;
      void qc.invalidateQueries({ queryKey: settingsKeys.users(storeId) });
    },
  });
}
