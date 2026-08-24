'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { Box, Button, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import { DocumentViewerDialog } from '@/features/shared/components/document-viewer-dialog';
import type { LeadContactInfo } from '@/features/shared/utils/lead-contact';
import { formatFileSizeLabel } from '@/features/properties/utils/property-media';
import type { ActiveDeal, ContactLeadDetail, LeadDocument, LeadDocumentKind } from '../types';
import { useUpdateDealStageMutation } from '../hooks/use-deals-queries';
import { isDealBeforeStage } from '../utils/lead-pipeline';
import { cacheLeadDocumentFile, removeCachedLeadDocumentFile } from '../utils/lead-document-file-cache';
import { printLeadDocument } from '../utils/lead-document-actions';
import { LeadDocumentSendMenu } from './lead-document-send-menu';
import { uploadLeadDocument } from '../services/leads-service';
import { dealKeys, leadKeys } from '../hooks/query-keys';
import { primarySoftSurface } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  listifyError,
} from './lead-form-tab-styles';

const MAX_BYTES = 15 * 1024 * 1024;

type LeadDocumentsTabProps = {
  leadId?: string;
  documents: readonly LeadDocument[];
  contact: LeadContactInfo;
  activeDeal?: ActiveDeal | null;
  onChange: (next: LeadDocument[]) => void;
  onActivity?: (message: string) => void;
};

function documentKind(doc: LeadDocument): LeadDocumentKind {
  return doc.kind === 'contract' ? 'contract' : 'other';
}

export function LeadDocumentsTab({
  leadId,
  documents,
  contact,
  activeDeal,
  onChange,
  onActivity,
}: LeadDocumentsTabProps) {
  const queryClient = useQueryClient();
  const updateStage = useUpdateDealStageMutation();
  const contractInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const [viewerDoc, setViewerDoc] = useState<LeadDocument | null>(null);
  const [removeConfirmDoc, setRemoveConfirmDoc] = useState<LeadDocument | null>(null);
  const [markSignedDoc, setMarkSignedDoc] = useState<LeadDocument | null>(null);
  const [dragOverKind, setDragOverKind] = useState<LeadDocumentKind | null>(null);

  const contracts = documents.filter((doc) => documentKind(doc) === 'contract');
  const others = documents.filter((doc) => documentKind(doc) === 'other');

  async function ingestFile(file: File, kind: LeadDocumentKind) {
    if (file.size > MAX_BYTES) {
      toast.error('Arquivo muito grande', {
        description: 'O limite é 15 MB.',
      });
      return;
    }

    const allowed = /\.(pdf|docx?)$/i.test(file.name);
    if (!allowed) {
      toast.error('Formato inválido', {
        description: 'Envie PDF ou DOCX.',
      });
      return;
    }

    if (leadId) {
      try {
        const updated = await uploadLeadDocument(leadId, file, kind);
        onChange([...updated.documents]);
        void queryClient.invalidateQueries({ queryKey: leadKeys.all });
        void queryClient.invalidateQueries({ queryKey: dealKeys.all });
        onActivity?.(
          kind === 'contract'
            ? `Contrato anexado: ${file.name}`
            : `Documento adicionado: ${file.name}`,
        );
        toast.success(
          kind === 'contract' ? 'Contrato anexado' : 'Documento adicionado',
        );
      } catch {
        toast.error('Não foi possível enviar o arquivo');
      }
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const doc: LeadDocument = {
      id: `ldoc-${crypto.randomUUID()}`,
      name: file.name,
      sizeLabel: formatFileSizeLabel(file.size),
      kind,
      addedAt: today,
      fileUrl: URL.createObjectURL(file),
    };
    cacheLeadDocumentFile(doc.id, file);
    onChange([...documents, doc]);
    onActivity?.(
      kind === 'contract'
        ? `Contrato anexado: ${file.name}`
        : `Documento adicionado: ${file.name}`,
    );
    toast.success(
      kind === 'contract' ? 'Contrato anexado' : 'Documento adicionado',
    );
  }

  function handleSelected(
    event: ChangeEvent<HTMLInputElement>,
    kind: LeadDocumentKind,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void ingestFile(file, kind);
  }

  function handleRemove(doc: LeadDocument) {
    if (doc.fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(doc.fileUrl);
    }
    removeCachedLeadDocumentFile(doc.id);
    onChange(documents.filter((item) => item.id !== doc.id));
    onActivity?.(
      documentKind(doc) === 'contract'
        ? `Contrato removido: ${doc.name}`
        : `Documento removido: ${doc.name}`,
    );
  }

  function handleDocumentSent(
    channel: 'email' | 'whatsapp',
    doc: LeadDocument,
    lead?: ContactLeadDetail,
  ) {
    if (lead) {
      onChange([...lead.documents]);
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
      void queryClient.invalidateQueries({ queryKey: dealKeys.all });
    }
    onActivity?.(
      channel === 'email'
        ? `Documento enviado por e-mail: ${doc.name}`
        : `Documento enviado por WhatsApp: ${doc.name}`,
    );
  }

  function handlePrint(doc: LeadDocument) {
    if (!printLeadDocument(doc)) return;
    onActivity?.(`Documento enviado para impressão: ${doc.name}`);
  }

  return (
    <Stack spacing={3}>
      <DocumentSection
        title="Contrato"
        description="Anexe o contrato para avançar o funil para Contrato enviado."
        emptyDescription="Nenhum contrato anexado ainda."
        documents={contracts}
        dragOver={dragOverKind === 'contract'}
        onOpenPicker={() => contractInputRef.current?.click()}
        onDragOverChange={(over) => setDragOverKind(over ? 'contract' : null)}
        onDropFile={(file) => void ingestFile(file, 'contract')}
        contact={contact}
        leadId={leadId}
        onView={setViewerDoc}
        onPrint={handlePrint}
        onRemove={setRemoveConfirmDoc}
        onSent={handleDocumentSent}
        canMarkSigned={(doc) =>
          Boolean(doc.sentAt) && isDealBeforeStage(activeDeal, 'contract_signed')
        }
        onMarkSigned={setMarkSignedDoc}
      />

      <input
        ref={contractInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf"
        className="sr-only"
        onChange={(event) => handleSelected(event, 'contract')}
      />

      <DocumentSection
        title="Outros documentos"
        description="Propostas, RG, comprovantes e anexos gerais — não movem o funil."
        emptyDescription="Nenhum documento anexado ainda."
        documents={others}
        dragOver={dragOverKind === 'other'}
        onOpenPicker={() => otherInputRef.current?.click()}
        onDragOverChange={(over) => setDragOverKind(over ? 'other' : null)}
        onDropFile={(file) => void ingestFile(file, 'other')}
        contact={contact}
        leadId={leadId}
        onView={setViewerDoc}
        onPrint={handlePrint}
        onRemove={setRemoveConfirmDoc}
        onSent={handleDocumentSent}
      />

      <input
        ref={otherInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf"
        className="sr-only"
        onChange={(event) => handleSelected(event, 'other')}
      />

      <DocumentViewerDialog
        open={viewerDoc !== null}
        document={viewerDoc}
        onOpenChange={(open) => {
          if (!open) setViewerDoc(null);
        }}
      />

      <Modal
        open={markSignedDoc !== null}
        onClose={() => setMarkSignedDoc(null)}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>Marcar contrato como assinado?</ModalTitle>
          <ModalContent>
            <ModalDescription>
              O negócio vai para a etapa Contrato assinado. O lembrete de
              assinatura some.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton onClick={() => setMarkSignedDoc(null)} />
            <ModalConfirmButton
              disabled={updateStage.isPending}
              onClick={() => {
                void (async () => {
                  if (!activeDeal?.id) return;
                  try {
                    await updateStage.mutateAsync({
                      id: activeDeal.id,
                      stage: 'contract_signed',
                    });
                    toast.success('Contrato marcado como assinado');
                    onActivity?.('Contrato marcado como assinado.');
                    setMarkSignedDoc(null);
                  } catch {
                    toast.error('Não foi possível atualizar o negócio');
                  }
                })();
              }}
            >
              Marcar como assinado
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>

      <Modal
        open={removeConfirmDoc !== null}
        onClose={() => setRemoveConfirmDoc(null)}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>
            {removeConfirmDoc && documentKind(removeConfirmDoc) === 'contract'
              ? 'Excluir contrato?'
              : 'Excluir documento?'}
          </ModalTitle>
          <ModalContent>
            <ModalDescription>
              Tem certeza que deseja excluir{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {removeConfirmDoc?.name || 'este arquivo'}
              </Box>
              ? Esta ação não pode ser desfeita.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton onClick={() => setRemoveConfirmDoc(null)} />
            <ModalConfirmButton
              color="error"
              onClick={() => {
                if (removeConfirmDoc) handleRemove(removeConfirmDoc);
                setRemoveConfirmDoc(null);
              }}
            >
              Excluir
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>
    </Stack>
  );
}

type DocumentSectionProps = {
  title: string;
  description: string;
  emptyDescription: string;
  documents: readonly LeadDocument[];
  dragOver: boolean;
  onOpenPicker: () => void;
  onDragOverChange: (over: boolean) => void;
  onDropFile: (file: File) => void;
  contact: LeadContactInfo;
  leadId?: string;
  onView: (doc: LeadDocument) => void;
  onPrint: (doc: LeadDocument) => void;
  onRemove: (doc: LeadDocument) => void;
  onSent: (
    channel: 'email' | 'whatsapp',
    doc: LeadDocument,
    lead?: ContactLeadDetail,
  ) => void;
  canMarkSigned?: (doc: LeadDocument) => boolean;
  onMarkSigned?: (doc: LeadDocument) => void;
};

function DocumentSection({
  title,
  description,
  emptyDescription,
  documents,
  dragOver,
  onOpenPicker,
  onDragOverChange,
  onDropFile,
  contact,
  leadId,
  onView,
  onPrint,
  onRemove,
  onSent,
  canMarkSigned,
  onMarkSigned,
}: DocumentSectionProps) {
  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.8125rem', fontWeight: 300, mt: 0.25 }}
        >
          {description}
        </Typography>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onOpenPicker}
        onDragOver={(event) => {
          event.preventDefault();
          onDragOverChange(true);
        }}
        onDragLeave={() => onDragOverChange(false)}
        onDrop={(event) => {
          event.preventDefault();
          onDragOverChange(false);
          const file = event.dataTransfer.files?.[0];
          if (file) onDropFile(file);
        }}
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          border: '1.5px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: '14px',
          bgcolor: dragOver
            ? (theme) => primarySoftSurface(theme)
            : 'secondary.light',
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s, border-color 0.15s',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: (theme) => primarySoftSurface(theme),
          },
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            width: 32,
            height: 32,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            bgcolor: (theme) => listifyElevatedSurface(theme),
            color: 'primary.main',
            boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
          }}
        >
          <UploadOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Enviar arquivo
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 300 }}
          >
            PDF ou DOCX · máx. 15 MB
          </Typography>
        </Box>
      </Box>

      {documents.length === 0 ? (
        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.8125rem', fontWeight: 300, px: 0.5 }}
        >
          {emptyDescription}
        </Typography>
      ) : (
        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {documents.map((doc) => (
            <Box
              component="li"
              key={doc.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: '16px',
                bgcolor: 'secondary.light',
                pr: 0.75,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => onView(doc)}
                sx={{
                  display: 'flex',
                  minWidth: 0,
                  flex: 1,
                  alignItems: 'center',
                  gap: 1.5,
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  px: 1.5,
                  py: 1.5,
                  borderRadius: '16px',
                  '&:hover': { bgcolor: 'secondary.main' },
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    bgcolor: listifyError[0],
                    color: listifyError[100],
                  }}
                >
                  <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.name}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem', fontWeight: 300 }}
                  >
                    {doc.sizeLabel} · {formatAddedAt(doc.addedAt)}
                    {doc.sentAt ? ' · Enviado' : ''}
                    {doc.viewedAt ? ' · Visualizado' : ''}
                  </Typography>
                </Box>
              </Box>
              <LeadDocumentSendMenu
                doc={doc}
                contact={contact}
                leadId={leadId}
                onSent={onSent}
              />
              {canMarkSigned?.(doc) ? (
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  onClick={() => onMarkSigned?.(doc)}
                  sx={{ textTransform: 'none', borderRadius: '12px', flexShrink: 0 }}
                >
                  Marcar como assinado
                </Button>
              ) : null}
              <IconButton
                size="small"
                aria-label={`Imprimir ${doc.name}`}
                onClick={() => onPrint(doc)}
                sx={{
                  width: 36,
                  height: 36,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: (theme) => primarySoftSurface(theme),
                  },
                }}
              >
                <PrintOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                aria-label={`Remover ${doc.name}`}
                onClick={() => onRemove(doc)}
                sx={{
                  width: 36,
                  height: 36,
                  color: 'text.secondary',
                  '&:hover': { color: listifyError[100], bgcolor: listifyError[0] },
                }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function formatAddedAt(isoDate: string): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
