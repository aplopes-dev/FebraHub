'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  Button,
  IconButton,
  Input,
  MenuItem,
  Select,
  Stack,
} from '@citybox/mui/atoms';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalTitle,
} from '@/components/ui/modal';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import {
  DocumentViewerDialog,
  type ViewableDocument,
} from '@/features/shared/components/document-viewer-dialog';
import { listDocumentFolders, summarizeDocuments } from '../services/settings-service';
import {
  useDeleteAgentFolderDocumentMutation,
  useDocumentsQuery,
  useUpdateAgentFolderDocumentMutation,
  useUploadAgentFolderDocumentMutation,
} from '../hooks/use-settings-queries';
import type { DocumentFile, DocumentFileStatus, DocumentFolderId } from '../types';

type LinkedTarget =
  | { kind: 'lead'; leadId: string }
  | { kind: 'property'; propertyId: string };

function parseLinkedTarget(id: string): LinkedTarget | null {
  if (id.startsWith('linked-lead:')) {
    const rest = id.slice('linked-lead:'.length);
    const sep = rest.indexOf(':');
    if (sep <= 0) return null;
    return { kind: 'lead', leadId: rest.slice(0, sep) };
  }
  if (id.startsWith('linked-property:')) {
    const rest = id.slice('linked-property:'.length);
    const sep = rest.indexOf(':');
    if (sep <= 0) return null;
    return { kind: 'property', propertyId: rest.slice(0, sep) };
  }
  return null;
}

function isManualFolderDocument(file: DocumentFile): boolean {
  return !file.source || file.source === 'manual';
}

function toViewable(file: DocumentFile): ViewableDocument {
  return {
    name: file.name,
    sizeLabel: file.sizeLabel,
    path: file.path,
  };
}

function originHref(file: DocumentFile): string | null {
  const linked = parseLinkedTarget(file.id);
  if (linked?.kind === 'lead') return `/leads/${linked.leadId}`;
  if (linked?.kind === 'property') return `/properties/${linked.propertyId}`;
  return null;
}

const STATUS_LABEL: Record<DocumentFileStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  archived: 'Arquivado',
};

function formatRelativeDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return '1 dia atrás';
  if (diffDays < 30) return `${diffDays} dias atrás`;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const SUMMARY_CARDS = [
  { key: 'allFolders' as const, label: 'Pastas', icon: FolderOpenOutlinedIcon },
  { key: 'pending' as const, label: 'Pendentes', icon: ScheduleOutlinedIcon },
  { key: 'completed' as const, label: 'Concluídos', icon: CheckCircleOutlinedIcon },
  { key: 'archived' as const, label: 'Arquivados', icon: ArchiveOutlinedIcon },
];

export function SettingsDocumentsTab({ agentId }: { agentId: string }) {
  const [folderId, setFolderId] = useState<DocumentFolderId | null>(null);
  const folders = listDocumentFolders();
  const { data: allDocs = [], isPending } = useDocumentsQuery(agentId);
  const { data: folderDocs = [] } = useDocumentsQuery(agentId, folderId ?? undefined, Boolean(folderId));
  const uploadMutation = useUploadAgentFolderDocumentMutation();

  const documents = folderId ? folderDocs : allDocs;
  const summary = useMemo(() => summarizeDocuments(allDocs), [allDocs]);
  const folderCounts = useMemo(() => {
    const counts = Object.fromEntries(folders.map((f) => [f.id, 0])) as Record<DocumentFolderId, number>;
    for (const doc of allDocs) counts[doc.folderId] = (counts[doc.folderId] ?? 0) + 1;
    return counts;
  }, [allDocs, folders]);

  const selectedFolder = folderId ? folders.find((f) => f.id === folderId) : null;
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const contractUploadRef = useRef<HTMLInputElement>(null);
  const generalFolders = folders.filter((folder) => folder.id !== 'signed');
  const contractDocs = useMemo(
    () => allDocs.filter((doc) => doc.folderId === 'signed'),
    [allDocs],
  );

  async function handleUpload(files: FileList | null, targetFolderId: DocumentFolderId) {
    if (!files?.length) return;
    const file = files[0];
    try {
      await uploadMutation.mutateAsync({
        agentId,
        folderId: targetFolderId,
        file,
      });
      toast.success(
        targetFolderId === 'signed' ? 'Contrato enviado' : 'Documento enviado',
      );
    } catch {
      toast.error('Não foi possível enviar o documento');
    }
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (contractUploadRef.current) contractUploadRef.current.value = '';
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando documentos…</p>;
  }

  if (selectedFolder) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setFolderId(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Voltar
        </button>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <input
            ref={uploadInputRef}
            type="file"
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files, selectedFolder.id)}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadOutlinedIcon />}
            disabled={uploadMutation.isPending}
            onClick={() => uploadInputRef.current?.click()}
          >
            Enviar arquivo
          </Button>
        </Stack>
        <DocumentsTable
          agentId={agentId}
          documents={documents}
          emptyLabel="Nenhum documento nesta pasta."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.key} className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <StatIconBadge icon={Icon} size="sm" />
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold">{summary[card.key]}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Contratos</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Contratos da carteira e uploads manuais. No lead, use a seção Contrato
              para avançar o funil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={contractUploadRef}
              type="file"
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files, 'signed')}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadOutlinedIcon />}
              disabled={uploadMutation.isPending}
              onClick={() => contractUploadRef.current?.click()}
            >
              Enviar contrato
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFolderId('signed')}
            >
              Ver pasta
            </Button>
          </div>
        </div>
        <DocumentsTable
          agentId={agentId}
          documents={contractDocs}
          emptyLabel="Nenhum contrato nesta pasta."
        />
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {generalFolders.map((folder) => (
          <li key={folder.id}>
            <button
              type="button"
              onClick={() => setFolderId(folder.id)}
              className="flex w-full flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-4 text-left"
            >
              <FolderOutlinedIcon sx={{ fontSize: 24 }} />
              <span className="text-sm font-medium">{folder.label}</span>
              <span className="text-xs text-muted-foreground">
                {folderCounts[folder.id] ?? 0} arquivos
              </span>
            </button>
          </li>
        ))}
      </ul>
      <DocumentsTable
        agentId={agentId}
        documents={documents.filter((doc) => doc.folderId !== 'signed')}
        emptyLabel="Nenhum documento cadastrado."
      />
    </div>
  );
}

function DocumentsTable({
  agentId,
  documents,
  emptyLabel,
}: {
  agentId: string;
  documents: readonly DocumentFile[];
  emptyLabel: string;
}) {
  const [editing, setEditing] = useState<DocumentFile | null>(null);
  const [viewerDoc, setViewerDoc] = useState<ViewableDocument | null>(null);
  const [detailsLabel, setDetailsLabel] = useState('');
  const [status, setStatus] = useState<DocumentFileStatus>('pending');
  const updateMutation = useUpdateAgentFolderDocumentMutation();
  const deleteMutation = useDeleteAgentFolderDocumentMutation();
  const router = useRouter();
  const pagination = useClientListPagination(documents);

  function openView(file: DocumentFile) {
    if (!file.path) {
      const href = originHref(file);
      if (href) {
        toast.message('Arquivo só no cadastro de origem', {
          description: 'Use “Abrir origem” para ver o anexo no lead ou imóvel.',
        });
        return;
      }
      toast.error('Arquivo indisponível para visualização.');
      return;
    }
    setViewerDoc(toViewable(file));
  }

  function openEdit(file: DocumentFile) {
    if (!isManualFolderDocument(file)) {
      if (file.source === 'profile-legal') {
        toast.message('Documento legal do perfil', {
          description: 'Edite ou remova na aba Informações.',
        });
        return;
      }
      toast.message('Documento do CRM', {
        description: 'Edite o anexo na ficha do lead ou do imóvel.',
      });
      return;
    }
    setEditing(file);
    setDetailsLabel(file.detailsLabel);
    setStatus(file.status);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        agentId,
        documentId: editing.id,
        detailsLabel: detailsLabel.trim(),
        status,
      });
      toast.success('Documento atualizado');
      setEditing(null);
    } catch {
      toast.error('Não foi possível atualizar o documento');
    }
  }

  async function handleDelete(file: DocumentFile) {
    if (!isManualFolderDocument(file)) {
      if (file.source === 'profile-legal') {
        toast.message('Documento espelhado do perfil', {
          description: 'Edite ou remova o documento legal na aba Informações.',
        });
        return;
      }
      toast.message('Documento do CRM', {
        description: 'Remova o anexo na ficha do lead ou do imóvel.',
      });
      return;
    }
    if (!window.confirm(`Excluir "${file.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ agentId, documentId: file.id });
      toast.success('Documento excluído');
    } catch {
      toast.error('Não foi possível excluir o documento');
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <Table
          sx={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
            minWidth: { xs: 720, sm: 900 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Arquivo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Adicionado</TableCell>
              <TableCell>Tamanho</TableCell>
              <TableCell>Detalhes</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagination.pageItems.map((file) => {
              const href = originHref(file);
              const canView = Boolean(file.path);
              const canEditDelete = isManualFolderDocument(file);

              return (
                <TableRow key={file.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 min-w-0">
                      <DescriptionOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                      {canView ? (
                        <button
                          type="button"
                          onClick={() => openView(file)}
                          className="truncate font-medium text-left hover:underline text-primary"
                        >
                          {file.name}
                        </button>
                      ) : (
                        <span className="truncate font-medium">{file.name}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{STATUS_LABEL[file.status]}</TableCell>
                  <TableCell>{formatRelativeDate(file.addedAt)}</TableCell>
                  <TableCell>{file.sizeLabel}</TableCell>
                  <TableCell>{file.detailsLabel}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton
                        aria-label={`Visualizar ${file.name}`}
                        size="small"
                        title={canView ? 'Visualizar / baixar' : 'Arquivo indisponível'}
                        disabled={!canView}
                        onClick={() => openView(file)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      {href ? (
                        <IconButton
                          aria-label={`Abrir origem de ${file.name}`}
                          size="small"
                          title="Abrir lead ou imóvel"
                          onClick={() => router.push(href)}
                        >
                          <OpenInNewOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                      <IconButton
                        aria-label={`Editar ${file.name}`}
                        size="small"
                        title={
                          canEditDelete
                            ? 'Editar'
                            : 'Só documentos da pasta do perfil podem ser editados aqui'
                        }
                        onClick={() => openEdit(file)}
                      >
                        <EditOutlinedIcon
                          fontSize="small"
                          sx={{ opacity: canEditDelete ? 1 : 0.45 }}
                        />
                      </IconButton>
                      <IconButton
                        aria-label={`Excluir ${file.name}`}
                        size="small"
                        title={
                          canEditDelete
                            ? 'Excluir'
                            : 'Só documentos da pasta do perfil podem ser excluídos aqui'
                        }
                        onClick={() => void handleDelete(file)}
                      >
                        <DeleteOutlinedIcon
                          fontSize="small"
                          sx={{ opacity: canEditDelete ? 1 : 0.45 }}
                        />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ListifyPagination
        count={pagination.total}
        page={pagination.page}
        perPage={pagination.perPage}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
        rowsPerPageOptions={pagination.perPageOptions}
      />

      <DocumentViewerDialog
        open={Boolean(viewerDoc)}
        document={viewerDoc}
        onOpenChange={(open) => {
          if (!open) setViewerDoc(null);
        }}
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)}>
        <ModalTitle>Editar documento</ModalTitle>
        <ModalContent>
          <Stack spacing={2}>
            <Input
              label="Detalhes"
              value={detailsLabel}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setDetailsLabel(event.target.value)
              }
              fullWidth
            />
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as DocumentFileStatus)}
              fullWidth
            >
              {(Object.keys(STATUS_LABEL) as DocumentFileStatus[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </ModalContent>
        <ModalActions>
          <ModalCancelButton onClick={() => setEditing(null)}>Cancelar</ModalCancelButton>
          <ModalConfirmButton
            disabled={updateMutation.isPending}
            onClick={() => void handleSaveEdit()}
          >
            Salvar
          </ModalConfirmButton>
        </ModalActions>
      </Modal>
    </>
  );
}
