'use client';

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from '@citybox/mui/molecules';
import { Box, IconButton, Input, Stack, Typography } from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalScrollBody,
  ModalTitle,
  modalFieldLabelSx,
  modalFieldRootSx,
  modalNoOutline,
} from '@/components/ui/modal';
import { listifyElevatedSurface, listifyModalFieldSurface } from '@/theme/listify-field-styles';
import {
  submitSupportTicket,
  SupportTicketValidationError,
} from '../services/support-ticket-service';

const EMPTY_FORM = {
  subject: '',
  description: '',
};

type SupportTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupportTicketDialog({
  open,
  onOpenChange,
}: SupportTicketDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm(EMPTY_FORM);
    setFiles([]);
    setFieldError(null);
    setFieldName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    if (submitting) return;
    onOpenChange(false);
    reset();
  }

  function setField<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (fieldName === key) {
      setFieldError(null);
      setFieldName(null);
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? []);
    setFiles(next);
    if (fieldName === 'files') {
      setFieldError(null);
      setFieldName(null);
    }
  }

  function removeFile(name: string) {
    setFiles((current) => current.filter((file) => file.name !== name));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFieldError(null);
    setFieldName(null);
    try {
      const result = await submitSupportTicket({ ...form, files });
      toast.success('Protocolo gerado neste aparelho', {
        description: `Guarde ${result.protocol}. O chamado ainda não é enviado à equipe.`,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      if (error instanceof SupportTicketValidationError) {
        setFieldName(error.field);
        setFieldError(error.message);
        toast.error(error.message);
      } else {
        toast.error('Não foi possível enviar o chamado. Tente de novo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'contents' }}>
        <ModalScrollBody>
          <ModalTitle>Novo chamado</ModalTitle>
          <ModalContent sx={{ pt: 0, gap: 1.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              O protocolo fica só neste aparelho. O chamado ainda não é enviado
              à equipe.
            </Typography>
            <FieldBlock
              label="Assunto"
              error={fieldName === 'subject' ? fieldError : null}
            >
              <Input
                value={form.subject}
                onChange={(event) => setField('subject', event.target.value)}
                placeholder="Resumo do problema"
                disabled={submitting}
                slotProps={{ htmlInput: { 'aria-label': 'Assunto' } }}
                sx={modalFieldRootSx}
              />
            </FieldBlock>

            <FieldBlock
              label="Descrição"
              error={fieldName === 'description' ? fieldError : null}
            >
              <Input
                multiline
                minRows={4}
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder="Descreva o passo a passo: o que você fez, o que esperava e o que aconteceu."
                disabled={submitting}
                slotProps={{ htmlInput: { 'aria-label': 'Descrição detalhada' } }}
                sx={ticketTextareaSx}
              />
            </FieldBlock>

            <FieldBlock
              label="Anexos (opcional)"
              error={fieldName === 'files' ? fieldError : null}
            >
              <Box
                component="button"
                type="button"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  px: 2,
                  py: 1.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  bgcolor: listifyElevatedSurface(theme),
                  cursor: submitting ? 'default' : 'pointer',
                  color: 'text.secondary',
                  textAlign: 'left',
                  font: 'inherit',
                })}
              >
                <AttachFileOutlinedIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.875rem' }}>
                  Prints, PDF ou logs — até 4 arquivos de 4 MB
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                onChange={handleFiles}
              />
              {files.length > 0 ? (
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {files.map((file) => (
                    <Stack
                      key={file.name}
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center' }}
                    >
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: '0.8125rem',
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {file.name}
                      </Typography>
                      <IconButton
                        aria-label={`Remover ${file.name}`}
                        size="small"
                        disabled={submitting}
                        onClick={() => removeFile(file.name)}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : null}
            </FieldBlock>
          </ModalContent>
        </ModalScrollBody>
        <ModalActions>
          <ModalCancelButton
            type="button"
            disabled={submitting}
            onClick={handleClose}
          />
          <ModalConfirmButton type="submit" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar chamado'}
          </ModalConfirmButton>
        </ModalActions>
      </Box>
    </Modal>
  );
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography sx={modalFieldLabelSx}>{label}</Typography>
      {children}
      {error ? (
        <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: 'error.main' }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}

const ticketTextareaSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  ...listifyModalFieldSurface(theme),
  '& .MuiOutlinedInput-root': {
    height: 'auto',
    minHeight: 120,
    alignItems: 'flex-start',
    borderRadius: '16px',
    px: 2,
    py: 1.5,
    fontSize: 15,
    fontWeight: 500,
    '& fieldset': modalNoOutline,
    '&:hover fieldset': modalNoOutline,
    '&.Mui-focused fieldset': modalNoOutline,
  },
});
