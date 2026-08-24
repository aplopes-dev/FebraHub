'use client';

import { useState, type MouseEvent } from 'react';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {
  IconButton,
  Menu,
  MenuItem,
} from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import type { LeadContactInfo } from '@/features/shared/utils/lead-contact';
import {
  deliverLeadDocumentByEmail,
  deliverLeadDocumentByWhatsApp,
  leadDocumentDeliveryAvailability,
} from '../services/lead-document-delivery.service';
import { primarySoftSurface } from '@/theme/accent-styles';
import type { ContactLeadDetail, LeadDocument } from '../types';

type LeadDocumentSendMenuProps = {
  doc: LeadDocument;
  contact: LeadContactInfo;
  leadId?: string;
  onSent?: (
    channel: 'email' | 'whatsapp',
    doc: LeadDocument,
    lead?: ContactLeadDetail,
  ) => void;
};

export function LeadDocumentSendMenu({
  doc,
  contact,
  leadId,
  onSent,
}: LeadDocumentSendMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const availability = leadDocumentDeliveryAvailability(contact);

  function closeMenu() {
    setAnchorEl(null);
  }

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!availability.email && !availability.whatsapp) {
      toast.error('Cadastre e-mail ou telefone do lead para enviar o documento.');
      return;
    }
    setAnchorEl(event.currentTarget);
  }

  function handleEmail() {
    closeMenu();
    void (async () => {
      const result = await deliverLeadDocumentByEmail({ leadId, doc, contact });
      if (!result) return;
      onSent?.('email', doc);
      if (result.mode === 'share') {
        toast.success('Compartilhe pelo app de e-mail com o anexo');
      }
    })();
  }

  async function handleWhatsApp() {
    closeMenu();
    const result = await deliverLeadDocumentByWhatsApp({ leadId, doc, contact });
    if (!result) return;
    onSent?.('whatsapp', doc, result.lead);
    toast.success('WhatsApp aberto com o link do documento');
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Enviar ${doc.name} ao cliente`}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        onClick={openMenu}
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
        <SendOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 220,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
            },
          },
        }}
      >
        <MenuItem onClick={handleEmail} disabled={!availability.email}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <MailOutlinedIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="E-mail"
            secondary={
              availability.email ? 'Abrir no cliente de e-mail' : 'E-mail não cadastrado'
            }
            slotProps={{
              primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
              secondary: {
                sx: {
                  fontSize: '0.75rem',
                  color: availability.email ? 'text.secondary' : 'text.disabled',
                },
              },
            }}
          />
        </MenuItem>
        <MenuItem onClick={() => void handleWhatsApp()} disabled={!availability.whatsapp}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ChatBubbleOutlinedIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="WhatsApp"
            secondary={
              availability.whatsapp
                ? 'Abrir conversa com o link do arquivo'
                : 'Telefone não cadastrado'
            }
            slotProps={{
              primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
              secondary: {
                sx: {
                  fontSize: '0.75rem',
                  color: availability.whatsapp ? 'text.secondary' : 'text.disabled',
                },
              },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
