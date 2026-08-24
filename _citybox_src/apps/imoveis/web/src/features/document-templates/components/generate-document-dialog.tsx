'use client';

import { useState } from 'react';
import { Button, Stack } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { DocumentViewerDialog } from '@/features/shared/components/document-viewer-dialog';
import {
  useDocumentTemplatesQuery,
  useGenerateDocumentMutation,
} from '../hooks/use-document-templates-queries';
import { filterTemplatesBySurface } from '../utils/filter-templates-by-surface';
import type {
  GenerateDocumentContext,
  GenerateSurface,
  GeneratedDocumentResult,
} from '../types';
import { DOCUMENT_TEMPLATE_TYPE_LABEL } from '../types';

type GenerateDocumentDialogProps = {
  open: boolean;
  surface: GenerateSurface;
  context: GenerateDocumentContext;
  kind?: 'contract' | 'other';
  disabledReason?: string;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (result: GeneratedDocumentResult) => void;
};

export function GenerateDocumentDialog({
  open,
  surface,
  context,
  kind,
  disabledReason,
  onOpenChange,
  onGenerated,
}: GenerateDocumentDialogProps) {
  const { data, isPending } = useDocumentTemplatesQuery({
    perPage: 100,
    enabled: open,
  });
  const generate = useGenerateDocumentMutation();
  const templates = filterTemplatesBySurface(data?.data ?? [], surface);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<GeneratedDocumentResult | null>(null);

  async function handleGenerate() {
    if (!selectedId) return;
    try {
      const result = await generate.mutateAsync({
        templateId: selectedId,
        kind,
        ...context,
      });
      toast.message('Documento gerado');
      onGenerated?.(result);
      onOpenChange(false);
      setViewer(result);
    } catch {
      toast.error('Não foi possível gerar o documento');
    }
  }

  return (
    <>
      <Modal open={open} onClose={() => onOpenChange(false)}>
        <ModalContent>
          <ModalTitle>Gerar a partir de modelo</ModalTitle>
          <ModalDescription>
            {disabledReason ||
              'O PDF entra nos documentos do lead e pode ser enviado depois.'}
          </ModalDescription>
          {disabledReason ? null : isPending ? (
            <p className="mt-3 text-sm text-muted-foreground">Carregando modelos…</p>
          ) : templates.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum modelo ativo para esta tela. Cadastre em Configurações →
              Modelos de documentos.
            </p>
          ) : (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedId === template.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedId(template.id)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  {template.nome} · {DOCUMENT_TEMPLATE_TYPE_LABEL[template.tipo]}
                </Button>
              ))}
            </Stack>
          )}
          <ModalActions>
            <ModalCancelButton onClick={() => onOpenChange(false)}>
              Cancelar
            </ModalCancelButton>
            <ModalConfirmButton
              disabled={!selectedId || Boolean(disabledReason) || generate.isPending}
              onClick={() => void handleGenerate()}
            >
              Gerar PDF
            </ModalConfirmButton>
          </ModalActions>
        </ModalContent>
      </Modal>
      <DocumentViewerDialog
        open={Boolean(viewer)}
        document={
          viewer
            ? {
                name: `${viewer.titulo}.pdf`,
                sizeLabel: 'PDF',
                path: viewer.path,
              }
            : null
        }
        onOpenChange={(next) => {
          if (!next) setViewer(null);
        }}
      />
    </>
  );
}
