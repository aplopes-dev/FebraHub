'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import { Box, Button, IconButton, Input, Stack } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { getAgentCatalogPath } from '@/features/shared/data/navigation';
import { copyText } from '@/features/shared/utils/copy-text';
import { whatsAppHref } from '@/features/shared/utils/lead-contact';
import {
  catalogShareMailto,
  catalogShareWhatsAppMessage,
} from '@/features/agent-catalog/utils/catalog-share';
import { formatPhoneBR } from '@/features/leads/utils/field-masks';
import { initialsFromName } from '../data/settings-store';
import {
  useAgentProfileQuery,
  useDeleteAgentPhotoMutation,
  useDeleteLegalDocumentMutation,
  usePutAgentProfileMutation,
  useUploadAgentPhotoMutation,
  useUpsertLegalDocumentMutation,
} from '../hooks/use-settings-queries';
import {
  LEGAL_DOC_LABEL,
  type AgentProfile,
  type LegalDocKind,
  type LegalDocument,
} from '../types';
import {
  SETTINGS_FIELD_SX,
  SettingsField,
} from '../utils/settings-form-styles';
import { SettingsProfileHeader } from './settings-profile-header';
import { SettingsGoogleCalendarCard } from './settings-google-calendar-card';

const LEGAL_DOC_KINDS: readonly LegalDocKind[] = [
  'license',
  'employment',
  'insurance',
];

type FormState = {
  name: string;
  role: string;
  email: string;
  phone: string;
  region: string;
  stateId: string;
  taxId: string;
};

function toFormState(profile: AgentProfile): FormState {
  return {
    name: profile.name,
    role: profile.role,
    email: profile.email,
    phone: formatPhoneBR(profile.phone),
    region: profile.region,
    stateId: profile.stateId,
    taxId: profile.taxId,
  };
}

/** Alinhado a `ImageFileValidator.maxBytes` na imoveis-api. */
const MAX_PROFILE_PHOTO_BYTES = 4 * 1024 * 1024;
const PROFILE_PHOTO_MAX_LABEL = '4 MB';
const PROFILE_PHOTO_TOO_LARGE = `A foto deve ter no máximo ${PROFILE_PHOTO_MAX_LABEL}`;
const PROFILE_PHOTO_HINT = `PNG, JPEG ou WebP · máx. ${PROFILE_PHOTO_MAX_LABEL}`;

function errorMessage(
  error: unknown,
  fallback: string,
  tooLargeHint?: string,
): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  // Multer legado (antes do filtro da API) ou proxy genérico
  if (tooLargeHint && /file too large/i.test(error.message)) {
    return tooLargeHint;
  }
  return error.message;
}

export function SettingsProfileInfoTab({ agentId }: { agentId: string }) {
  const { data: profile, isPending, isError, dataUpdatedAt } =
    useAgentProfileQuery(agentId);

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o perfil. Tente novamente.
      </p>
    );
  }
  if (isPending || !profile) {
    return <p className="text-sm text-muted-foreground">Carregando perfil…</p>;
  }

  return (
    <ProfileInfoForm
      agentId={agentId}
      profile={profile}
      photoRevision={dataUpdatedAt}
    />
  );
}

type ProfileInfoFormProps = {
  agentId: string;
  profile: AgentProfile;
  photoRevision: number;
};

/** Monta só com o perfil carregado — estado inicial vem do primeiro fetch. */
function ProfileInfoForm({ agentId, profile, photoRevision }: ProfileInfoFormProps) {
  const putProfile = usePutAgentProfileMutation();
  const uploadPhoto = useUploadAgentPhotoMutation();
  const deletePhoto = useDeleteAgentPhotoMutation();
  const upsertDocument = useUpsertLegalDocumentMutation();
  const deleteDocument = useDeleteLegalDocumentMutation();

  const [form, setForm] = useState<FormState>(() => toFormState(profile));
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [uploadingKind, setUploadingKind] = useState<LegalDocKind | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      toast.error(PROFILE_PHOTO_TOO_LARGE);
      return;
    }
    uploadPhoto.mutate(
      { agentId, file },
      {
        onSuccess: () => toast.success('Foto atualizada'),
        onError: (error) =>
          toast.error(
            errorMessage(error, 'Falha ao enviar a foto', PROFILE_PHOTO_TOO_LARGE),
          ),
      },
    );
  }

  function handlePhotoRemove() {
    deletePhoto.mutate(
      { agentId },
      {
        onSuccess: () => toast.success('Foto removida'),
        onError: (error) =>
          toast.error(errorMessage(error, 'Falha ao remover a foto')),
      },
    );
  }

  function openDocumentPicker(kind: LegalDocKind) {
    setUploadingKind(kind);
    documentInputRef.current?.click();
  }

  function handleDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    const kind = uploadingKind;
    setUploadingKind(null);
    if (!file || !kind) return;
    upsertDocument.mutate(
      { agentId, kind, file },
      {
        onSuccess: () => toast.success('Documento anexado'),
        onError: (error) =>
          toast.error(errorMessage(error, 'Falha ao enviar o documento')),
      },
    );
  }

  function handleDocumentRemove(kind: LegalDocKind) {
    deleteDocument.mutate(
      { agentId, kind },
      {
        onSuccess: () => toast.success('Documento removido'),
        onError: (error) =>
          toast.error(errorMessage(error, 'Falha ao remover o documento')),
      },
    );
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Informe o nome completo');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Informe o e-mail');
      return;
    }
    putProfile.mutate(
      { agentId, input: form },
      {
        onSuccess: (saved) => {
          setForm(toFormState(saved));
          toast.success('Alterações salvas');
        },
        onError: (error) =>
          toast.error(errorMessage(error, 'Falha ao salvar o perfil')),
      },
    );
  }

  const headerProfile: AgentProfile = {
    ...profile,
    name: form.name || profile.name,
    role: form.role || profile.role,
    initials: initialsFromName(form.name || profile.name),
  };

  function legalDoc(kind: LegalDocKind): LegalDocument | undefined {
    return profile.legalDocuments.find((doc) => doc.kind === kind);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Stack spacing={1} sx={{ minWidth: 0, width: '100%' }}>
        <SettingsProfileHeader
          profile={headerProfile}
          photoRevision={photoRevision}
          action={
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', flexShrink: 0 }}
            >
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<UploadOutlinedIcon sx={{ fontSize: 16 }} />}
                disabled={uploadPhoto.isPending}
                sx={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  borderRadius: 999,
                  textTransform: 'none',
                  px: { xs: 1.25, sm: 1.75 },
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
                {uploadPhoto.isPending ? 'Enviando…' : 'Alterar foto'}
              </Button>
              {profile.photoUrl ? (
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  disabled={deletePhoto.isPending}
                  onClick={handlePhotoRemove}
                  sx={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    borderRadius: 999,
                    textTransform: 'none',
                    minWidth: 0,
                    px: { xs: 0.75, sm: 1.25 },
                  }}
                >
                  Remover
                </Button>
              ) : null}
            </Stack>
          }
        />
        <Box
          component="p"
          sx={{ m: 0, fontSize: '0.75rem', color: 'text.secondary' }}
        >
          {PROFILE_PHOTO_HINT}
        </Box>
      </Stack>

      <CatalogLinkField agentId={agentId} agentPhone={profile.phone} agentName={profile.name} />

      <SettingsGoogleCalendarCard />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="Nome completo" htmlFor="settings-profile-name">
          <Input
            id="settings-profile-name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Seu nome"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
        <SettingsField label="E-mail" htmlFor="settings-profile-email">
          <Input
            id="settings-profile-email"
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="voce@email.com"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
        <SettingsField label="Telefone" htmlFor="settings-profile-phone">
          <Input
            id="settings-profile-phone"
            value={form.phone}
            onChange={(event) => update('phone', formatPhoneBR(event.target.value))}
            placeholder="(00) 00000-0000"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
        <SettingsField label="Região" htmlFor="settings-profile-region">
          <Input
            id="settings-profile-region"
            value={form.region}
            onChange={(event) => update('region', event.target.value)}
            placeholder="Cidade, UF"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
        <SettingsField label="CRECI / State ID" htmlFor="settings-profile-state-id">
          <Input
            id="settings-profile-state-id"
            value={form.stateId}
            onChange={(event) => update('stateId', event.target.value)}
            placeholder="CRECI-XX 00.000"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
        <SettingsField label="CNPJ / Tax ID" htmlFor="settings-profile-tax-id">
          <Input
            id="settings-profile-tax-id"
            value={form.taxId}
            onChange={(event) => update('taxId', event.target.value)}
            placeholder="00.000.000/0000-00"
            fullWidth
            sx={SETTINGS_FIELD_SX}
          />
        </SettingsField>
      </div>

      <div className="min-w-0 space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">Documentos legais</h3>
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf"
          className="sr-only"
          onChange={handleDocumentChange}
        />
        <ul className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL_DOC_KINDS.map((kind) => {
            const doc = legalDoc(kind);

            if (!doc) {
              return (
                <li key={kind} className="min-w-0">
                  <button
                    type="button"
                    disabled={upsertDocument.isPending}
                    onClick={() => openDocumentPicker(kind)}
                    className="flex h-full min-h-[5.5rem] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/30 px-4 py-3 text-center transition-colors hover:bg-secondary/50 disabled:opacity-60"
                  >
                    <UploadOutlinedIcon className="size-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {LEGAL_DOC_LABEL[kind]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      PDF, DOCX (máx. 15 MB)
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li
                key={kind}
                className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 px-3 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                  </span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs font-medium text-muted-foreground">
                      {LEGAL_DOC_LABEL[kind]}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {doc.name || LEGAL_DOC_LABEL[kind]}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.sizeLabel || '—'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="text"
                  color="error"
                  size="small"
                  className="w-full shrink-0 self-stretch rounded-full sm:w-auto sm:self-center"
                  startIcon={<DeleteOutlinedIcon sx={{ fontSize: 16 }} />}
                  disabled={deleteDocument.isPending}
                  onClick={() => handleDocumentRemove(kind)}
                  aria-label={`Remover ${LEGAL_DOC_LABEL[kind]}`}
                >
                  Excluir
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center gap-3 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="contained"
          className="h-11 min-w-[12rem] flex-1 rounded-3xl sm:flex-none sm:px-10"
          disabled={putProfile.isPending}
          onClick={handleSave}
        >
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function CatalogLinkField({
  agentId,
  agentPhone,
  agentName,
}: {
  agentId: string;
  agentPhone: string;
  agentName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState(() => getAgentCatalogPath(agentId));

  useEffect(() => {
    setCatalogUrl(`${window.location.origin}${getAgentCatalogPath(agentId)}`);
  }, [agentId]);

  async function handleCopy() {
    const url = `${window.location.origin}${getAgentCatalogPath(agentId)}`;
    const ok = await copyText(url);
    if (!ok) {
      toast.error('Não foi possível copiar');
      return;
    }
    setCopied(true);
    toast.success('Link do catálogo copiado');
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleOpen() {
    const url = `${window.location.origin}${getAgentCatalogPath(agentId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleWhatsAppShare() {
    const text = catalogShareWhatsAppMessage(agentId);
    window.open(whatsAppHref(agentPhone, text), '_blank', 'noopener,noreferrer');
  }

  function handleEmailShare() {
    window.location.href = catalogShareMailto(agentId, agentName);
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 1.5, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minWidth: 0,
      }}
    >
      <SettingsField
        label="Link do catálogo"
        htmlFor="settings-profile-catalog-url"
      >
        <Stack spacing={1.25} sx={{ minWidth: 0, width: '100%' }}>
          <Input
            id="settings-profile-catalog-url"
            value={catalogUrl}
            fullWidth
            sx={SETTINGS_FIELD_SX}
            slotProps={{
              htmlInput: { readOnly: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 0.25 }}>
                    <IconButton
                      aria-label="Copiar link do catálogo"
                      onClick={() => void handleCopy()}
                      size="small"
                      color="inherit"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'text.primary' },
                      }}
                    >
                      {copied ? (
                        <CheckIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1,
              width: '100%',
            }}
          >
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpen}
              sx={catalogActionSx}
            >
              Abrir
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<ChatBubbleOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleWhatsAppShare}
              disabled={!agentPhone.trim()}
              sx={catalogActionSx}
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<MailOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleEmailShare}
              sx={{
                ...catalogActionSx,
                gridColumn: { xs: '1 / -1', sm: 'auto' },
              }}
            >
              E-mail
            </Button>
          </Box>
        </Stack>
      </SettingsField>
      <Box
        component="p"
        sx={{
          m: 0,
          mt: 1,
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        Compartilhe este link com clientes — eles veem seus imóveis sem precisar
        entrar no sistema.
      </Box>
    </Box>
  );
}

const catalogActionSx = {
  minWidth: 0,
  width: '100%',
  borderRadius: 999,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  px: 1.25,
} as const;
