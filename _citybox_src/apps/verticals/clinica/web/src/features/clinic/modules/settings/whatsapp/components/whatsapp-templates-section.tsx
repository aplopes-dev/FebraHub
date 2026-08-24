'use client';

import { useCallback, useState } from 'react';
import type {
  WhatsappTemplateItem,
  WhatsappTemplateKey,
} from '../types/whatsapp';
import { WhatsappTemplatePreviewDialog } from './whatsapp-template-preview-dialog';
import { WhatsappTemplateSheet } from './whatsapp-template-sheet';
import { WhatsappTemplatesTable } from './whatsapp-templates-table';

type WhatsappTemplatesSectionProps = {
  templates: WhatsappTemplateItem[] | undefined;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (item: {
    key: WhatsappTemplateKey;
    body: string;
  }) => Promise<void>;
};

export function WhatsappTemplatesSection({
  templates,
  isLoading,
  isSaving,
  onSave,
}: WhatsappTemplatesSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WhatsappTemplateItem | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<WhatsappTemplateItem | null>(null);

  const handleEdit = useCallback((template: WhatsappTemplateItem) => {
    setEditingTemplate(template);
    setSheetOpen(true);
  }, []);

  const handlePreview = useCallback((template: WhatsappTemplateItem) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isSaving) return;
      setSheetOpen(open);
      if (!open) {
        setEditingTemplate(null);
      }
    },
    [isSaving],
  );

  const handlePreviewOpenChange = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreviewTemplate(null);
    }
  }, []);

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Templates</h2>
        <p className="text-sm text-muted-foreground">
          Edite cada template para personalizar o texto da mensagem.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando templates…</p>
      ) : (
        <WhatsappTemplatesTable
          templates={templates ?? []}
          onPreview={handlePreview}
          onEdit={handleEdit}
        />
      )}

      <WhatsappTemplateSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        editingTemplate={editingTemplate}
        isSaving={isSaving}
        onSave={onSave}
      />

      <WhatsappTemplatePreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        template={previewTemplate}
      />
    </section>
  );
}
