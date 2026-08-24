'use client';

import { useCallback, useId, useState } from 'react';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
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
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { useBatchCreateLeadsMutation } from '../hooks/use-leads-queries';
import {
  downloadLeadsTemplateCsv,
  parseLeadsCsv,
  type ImportedLeadRow,
} from '../utils/parse-leads-csv';

type ImportLeadsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportLeadsModal({ open, onOpenChange }: ImportLeadsModalProps) {
  const inputId = useId();
  const batchMutation = useBatchCreateLeadsMutation();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportedLeadRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFileName(null);
    setRows([]);
    setParseError(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    if (batchMutation.isPending) return;
    reset();
    onOpenChange(false);
  }, [batchMutation.isPending, onOpenChange, reset]);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Selecione um arquivo .csv');
      setFileName(null);
      setRows([]);
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseLeadsCsv(text);
      if (parsed.length === 0) {
        setParseError(
          'Nenhum lead válido no arquivo. Use cabeçalhos name,phone,email,notes.',
        );
        setFileName(file.name);
        setRows([]);
        return;
      }
      setParseError(null);
      setFileName(file.name);
      setRows(parsed);
    } catch {
      setParseError('Não foi possível ler o arquivo CSV.');
      setFileName(null);
      setRows([]);
    }
  }, []);

  async function handleImport() {
    if (rows.length === 0) {
      toast.error('Selecione um CSV com pelo menos um lead');
      return;
    }
    try {
      const result = await batchMutation.mutateAsync(rows);
      const skipped =
        result.skippedCount > 0
          ? ` (${result.skippedCount} linha(s) ignorada(s))`
          : '';
      toast.success(
        `${result.successCount} lead(s) importado(s)${skipped}`,
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível importar os leads',
      );
    }
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm">
      <ModalScrollBody>
        <ModalTitle>Importar Leads</ModalTitle>
        <ModalDescription>
          Baixe o modelo CSV, preencha as linhas e envie o arquivo para criar
          leads na sua carteira.
        </ModalDescription>

        <ModalContent>
          <Button
            type="button"
            variant="text"
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={() => downloadLeadsTemplateCsv()}
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none',
              fontWeight: 500,
              px: 0,
              minWidth: 0,
            }}
          >
            Baixar planilha modelo (.csv)
          </Button>

          <Box
            component="label"
            htmlFor={inputId}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void processFile(e.dataTransfer.files?.[0]);
            }}
            sx={(theme) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              minHeight: 140,
              px: 2,
              py: 3,
              borderRadius: '16px',
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'divider',
              bgcolor: dragOver
                ? 'action.hover'
                : listifyElevatedSurface(theme),
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': {
                borderColor: 'primary.light',
              },
            })}
          >
            <CloudUploadOutlinedIcon
              sx={{ fontSize: 36, color: 'text.secondary' }}
            />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {fileName
                ? fileName
                : 'Arraste o CSV aqui ou clique para selecionar'}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              Aceita .csv até 500 leads
            </Typography>
            <Box
              component="input"
              id={inputId}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                void processFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </Box>

          {parseError ? (
            <Typography color="error" sx={{ fontSize: '0.8125rem' }}>
              {parseError}
            </Typography>
          ) : null}

          {rows.length > 0 && !parseError ? (
            <Typography
              color="text.secondary"
              sx={{ fontSize: '0.8125rem' }}
            >
              {rows.length} lead(s) pronto(s) para importar
            </Typography>
          ) : null}
        </ModalContent>

        <ModalActions>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <ModalCancelButton
              type="button"
              onClick={handleClose}
              disabled={batchMutation.isPending}
            >
              Cancelar
            </ModalCancelButton>
            <ModalConfirmButton
              type="button"
              onClick={() => void handleImport()}
              disabled={rows.length === 0 || batchMutation.isPending}
            >
              {batchMutation.isPending
                ? 'Importando…'
                : 'Processar e Importar Leads'}
            </ModalConfirmButton>
          </Stack>
        </ModalActions>
      </ModalScrollBody>
    </Modal>
  );
}
