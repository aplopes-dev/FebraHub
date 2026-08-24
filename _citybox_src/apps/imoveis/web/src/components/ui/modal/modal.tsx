'use client';

import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type ButtonProps,
  type DialogActionsProps,
  type DialogContentProps,
  type DialogContentTextProps,
  type DialogProps,
  type DialogTitleProps,
} from '@citybox/mui/atoms';
import { listifyModalPaperSx } from '@/theme/listify-field-styles';
import { listifyRadii, listifyShadows } from '@/theme/tokens';
import { SCROLL_CLASS } from '@/lib/scroll';

/**
 * Modal Imóveis — padrão visual do sistema (referência: agenda /
 * “Adicionar compromisso”).
 *
 * Paper glass: radius 28px, padding responsivo, blur 42.6px,
 * sombra `0px 2px 8.2px #32323226`. Campos: `modal-form-styles.ts`.
 * Use sempre estes exports em vez de `Dialog` cru do `@citybox/mui`.
 */

function mergeSx(...parts: Array<SxProps<Theme> | undefined>): SxProps<Theme> {
  const list: SxProps<Theme>[] = [];

  for (const part of parts) {
    if (part == null) continue;
    list.push(part);
  }

  if (list.length === 0) return {};
  if (list.length === 1) return list[0]!;
  return list as unknown as SxProps<Theme>;
}

const PAPER_SX: SxProps<Theme> = listifyModalPaperSx;

/** Wrapper scrollável do conteúdo do modal (título + form + actions). */
export function ModalScrollBody({ children }: { children: ReactNode }) {
  return (
    <Box
      className={SCROLL_CLASS}
      sx={{
        display: 'flex',
        minHeight: 0,
        minWidth: 0,
        maxWidth: '100%',
        flex: 1,
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        gap: 2.5,
      }}
    >
      {children}
    </Box>
  );
}

const BACKDROP_SX: SxProps<Theme> = {
  bgcolor: 'rgba(13, 13, 18, 0.12)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
};

export type ModalProps = DialogProps;

export function Modal({
  children,
  fullWidth = true,
  maxWidth = 'sm',
  slotProps,
  ...props
}: ModalProps) {
  const slotPaper =
    slotProps?.paper && typeof slotProps.paper === 'object'
      ? (slotProps.paper as { sx?: SxProps<Theme> })
      : undefined;
  const slotBackdrop =
    slotProps?.backdrop && typeof slotProps.backdrop === 'object'
      ? (slotProps.backdrop as { sx?: SxProps<Theme> })
      : undefined;

  return (
    <Dialog
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      {...props}
      slotProps={{
        ...slotProps,
        paper: {
          ...slotPaper,
          sx: mergeSx(PAPER_SX, slotPaper?.sx),
        },
        backdrop: {
          ...slotBackdrop,
          sx: mergeSx(BACKDROP_SX, slotBackdrop?.sx),
        },
      }}
    >
      {children}
    </Dialog>
  );
}

export type ModalTitleProps = DialogTitleProps;

export function ModalTitle({ children, sx, ...props }: ModalTitleProps) {
  return (
    <DialogTitle
      {...props}
      sx={mergeSx(
        {
          p: 0,
          m: 0,
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          color: 'text.primary',
        },
        sx,
      )}
    >
      {children}
    </DialogTitle>
  );
}

export type ModalContentProps = DialogContentProps;

export function ModalContent({
  children,
  dividers: _dividers,
  className,
  sx,
  ...props
}: ModalContentProps) {
  return (
    <DialogContent
      {...props}
      dividers={false}
      className={[SCROLL_CLASS, className].filter(Boolean).join(' ')}
      sx={mergeSx(
        {
          p: 0,
          m: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          color: 'text.primary',
          '&.MuiDialogContent-root': { p: 0 },
        },
        sx,
      )}
    >
      {children}
    </DialogContent>
  );
}

export type ModalDescriptionProps = DialogContentTextProps;

export function ModalDescription({ sx, ...props }: ModalDescriptionProps) {
  return (
    <DialogContentText
      {...props}
      sx={mergeSx(
        {
          m: 0,
          fontSize: '0.875rem',
          fontWeight: 300,
          lineHeight: 1.55,
          color: 'text.secondary',
        },
        sx,
      )}
    />
  );
}

export type ModalActionsProps = DialogActionsProps & { children?: ReactNode };

export function ModalActions({ children, sx, ...props }: ModalActionsProps) {
  return (
    <DialogActions
      {...props}
      disableSpacing
      sx={mergeSx(
        {
          p: 0,
          m: 0,
          gap: 1.5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
          width: '100%',
          minWidth: 0,
          '& > :not(style)': { m: 0 },
        },
        sx,
      )}
    >
      {children}
    </DialogActions>
  );
}

type ModalButtonProps = ButtonProps;

/** Botão secundário do footer (Cancelar) — greyscale + radius 12. */
export function ModalCancelButton({
  children = 'Cancelar',
  sx,
  ...props
}: ModalButtonProps) {
  return (
    <Button
      variant="outlined"
      color="inherit"
      fullWidth
      {...props}
      sx={mergeSx(
        {
          flex: 1,
          minWidth: 0,
          height: 52,
          px: { xs: 2, sm: 3 },
          py: 1.75,
          borderRadius: `${listifyRadii.lg}px`,
          borderColor: 'divider',
          bgcolor: 'secondary.main',
          color: 'text.primary',
          fontSize: '1rem',
          fontWeight: 500,
          lineHeight: 1.6,
          textTransform: 'none',
          whiteSpace: { xs: 'normal', sm: 'nowrap' },
          boxShadow: listifyShadows.none,
          '&:hover': {
            borderColor: 'divider',
            bgcolor: 'secondary.dark',
            boxShadow: listifyShadows.none,
          },
        },
        sx,
      )}
    >
      {children}
    </Button>
  );
}

/** Botão primário do footer (Próximo / Confirmar) — primary + radius 12. */
export function ModalConfirmButton({
  children = 'Próximo',
  sx,
  ...props
}: ModalButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      {...props}
      sx={mergeSx(
        {
          flex: 1,
          minWidth: 0,
          height: 52,
          px: { xs: 2, sm: 3 },
          py: 1.75,
          borderRadius: `${listifyRadii.lg}px`,
          fontSize: '1rem',
          fontWeight: 500,
          lineHeight: 1.55,
          textTransform: 'none',
          whiteSpace: { xs: 'normal', sm: 'nowrap' },
        },
        sx,
      )}
    >
      {children}
    </Button>
  );
}
