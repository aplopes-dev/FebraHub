'use client';

import { useMemo } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableStyleProps } from '@/features/shared/lib/data-table-styles';
import {
  WHATSAPP_TEMPLATE_LABELS,
  type WhatsappTemplateItem,
} from '../types/whatsapp';

type WhatsappTemplatesTableProps = {
  templates: WhatsappTemplateItem[];
  onPreview?: (template: WhatsappTemplateItem) => void;
  onEdit?: (template: WhatsappTemplateItem) => void;
};

type WhatsappTemplateRow = WhatsappTemplateItem & { name: string };

export function WhatsappTemplatesTable({
  templates,
  onPreview,
  onEdit,
}: WhatsappTemplatesTableProps) {
  const rows = useMemo<WhatsappTemplateRow[]>(
    () =>
      templates.map((template) => ({
        ...template,
        name: WHATSAPP_TEMPLATE_LABELS[template.key],
      })),
    [templates],
  );

  const columns = useMemo<ColumnDef<WhatsappTemplateRow>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Visualizar ${row.original.name}`}
              onClick={() => onPreview?.(row.original)}
            >
              <Eye className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${row.original.name}`}
              onClick={() => onEdit?.(row.original)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onPreview],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={20}
      entityName="templates"
      emptyMessage="Nenhum template WhatsApp disponível."
      emptyPaginationLabel="Nenhum template"
      paginationClassName={rows.length <= 20 ? 'hidden' : undefined}
      {...erpDataTableStyleProps}
    />
  );
}
