'use client';

import {
  cloneElement,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { PopoverOrigin } from '@mui/material/Popover';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import type { Theme } from '@mui/material/styles';
import { Box, IconButton, Popover, Stack, Typography } from '@citybox/mui/atoms';
import {
  hasLeadContact,
  mailtoHref,
  telHref,
  whatsAppHref,
  type LeadContactInfo,
} from '@/features/shared/utils/lead-contact';
import { listifyPopoverPaperSx } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';

type LeadContactPopoverProps = {
  contact: LeadContactInfo;
  children: ReactElement<{ onClick?: (event: MouseEvent) => void }>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  /** Popover aninhado (ex.: dentro do popover de compromisso) — z-index maior. */
  nested?: boolean;
};

function contactOrigins(
  side: NonNullable<LeadContactPopoverProps['side']>,
  align: NonNullable<LeadContactPopoverProps['align']>,
): { anchorOrigin: PopoverOrigin; transformOrigin: PopoverOrigin } {
  const verticalAlign: PopoverOrigin['vertical'] =
    align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center';
  const horizontalAlign: PopoverOrigin['horizontal'] =
    align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';

  switch (side) {
    case 'top':
      return {
        anchorOrigin: { vertical: 'top', horizontal: horizontalAlign },
        transformOrigin: { vertical: 'bottom', horizontal: horizontalAlign },
      };
    case 'bottom':
      return {
        anchorOrigin: { vertical: 'bottom', horizontal: horizontalAlign },
        transformOrigin: { vertical: 'top', horizontal: horizontalAlign },
      };
    case 'right':
      return {
        anchorOrigin: { vertical: verticalAlign, horizontal: 'right' },
        transformOrigin: { vertical: verticalAlign, horizontal: 'left' },
      };
    case 'left':
    default:
      return {
        anchorOrigin: { vertical: verticalAlign, horizontal: 'left' },
        transformOrigin: { vertical: verticalAlign, horizontal: 'right' },
      };
  }
}

function ContactAction({
  href,
  label,
  disabled,
  children,
  external,
}: {
  href?: string;
  label: string;
  disabled?: boolean;
  children: ReactNode;
  external?: boolean;
}) {
  const baseSx = (theme: Theme) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    bgcolor: listifyElevatedSurface(theme),
    color: 'text.primary',
    boxShadow: listifyShadows.xs,
    transition: 'background-color 0.15s, color 0.15s',
  });

  if (disabled || !href) {
    return (
      <IconButton
        type="button"
        disabled
        aria-label={label}
        size="small"
        sx={(theme) => ({
          ...baseSx(theme),
          bgcolor: 'secondary.main',
          color: 'text.disabled',
          boxShadow: 'none',
        })}
      >
        {children}
      </IconButton>
    );
  }

  return (
    <Box
      component="a"
      href={href}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(event) => event.stopPropagation()}
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        ...baseSx(theme),
        '&:hover': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        },
      })}
    >
      {children}
    </Box>
  );
}

/**
 * Popover de contato Listify — mesmo shell do popover de compromisso
 * (cream accent via `primarySoftSurface`, radius 24, ações circulares).
 */
export function LeadContactPopover({
  contact,
  children,
  side = 'left',
  align = 'start',
  sideOffset = 8,
  nested = false,
}: LeadContactPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  const hasContact = hasLeadContact(contact);
  const origins = contactOrigins(side, align);

  const whatsAppMessage = `Olá ${contact.name}, tudo bem?`;

  const trigger = cloneElement(children, {
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      children.props.onClick?.(event);
      setAnchorEl(event.currentTarget as HTMLElement);
    },
  });

  return (
    <>
      {trigger}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={origins.anchorOrigin}
        transformOrigin={origins.transformOrigin}
        disableScrollLock
        slotProps={{
          paper: {
            sx: (theme) =>
              listifyPopoverPaperSx(theme, {
                width: 300,
                maxWidth: 'calc(100vw - 32px)',
                p: 2.5,
                ml: side === 'left' ? `-${sideOffset}px` : undefined,
                mr: side === 'right' ? `-${sideOffset}px` : undefined,
                mt: side === 'bottom' ? `${sideOffset}px` : undefined,
                mb: side === 'top' ? `-${sideOffset}px` : undefined,
                ...(nested ? { zIndex: 1600 } : {}),
              }),
          },
        }}
        sx={nested ? { zIndex: 1600 } : undefined}
      >
        <Stack spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.35,
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              {contact.name}
            </Typography>

            {hasContact ? (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {phone ? (
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: 'text.secondary',
                    }}
                  >
                    {phone}
                  </Typography>
                ) : null}
                {email ? (
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: 'text.secondary',
                    }}
                  >
                    {email}
                  </Typography>
                ) : null}
              </Stack>
            ) : (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: 'text.secondary',
                }}
              >
                Nenhum contato cadastrado para este lead.
              </Typography>
            )}
          </Box>

          {hasContact ? (
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <ContactAction
                href={phone ? whatsAppHref(phone, whatsAppMessage) : undefined}
                label="Enviar mensagem no WhatsApp"
                disabled={!phone}
                external
              >
                <ChatBubbleOutlinedIcon sx={{ fontSize: 18 }} />
              </ContactAction>
              <ContactAction
                href={email ? mailtoHref(email) : undefined}
                label="Enviar e-mail"
                disabled={!email}
              >
                <MailOutlinedIcon sx={{ fontSize: 18 }} />
              </ContactAction>
              <ContactAction
                href={phone ? telHref(phone) : undefined}
                label="Ligar"
                disabled={!phone}
              >
                <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
              </ContactAction>
            </Stack>
          ) : null}
        </Stack>
      </Popover>
    </>
  );
}
