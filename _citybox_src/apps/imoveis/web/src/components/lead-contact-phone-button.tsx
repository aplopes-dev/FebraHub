'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { IconButton } from '@citybox/mui/atoms';
import { LeadContactPopover } from '@/components/lead-contact-popover';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import type { LeadContactInfo } from '@/features/shared/utils/lead-contact';

type LeadContactPhoneButtonProps = {
  contact: LeadContactInfo;
  /** `lg` = card do dashboard (size-11); `md` = cards de lead; `sm` = popover da agenda. */
  size?: 'sm' | 'md' | 'lg';
  /** `popover` = fundo translúcido dentro do popover de compromisso. */
  variant?: 'secondary' | 'popover';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  nested?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
};

const SIZE_PX = {
  sm: { box: 32, icon: 14 },
  md: { box: 36, icon: 16 },
  lg: { box: 44, icon: 18 },
} as const;

export function LeadContactPhoneButton({
  contact,
  size = 'md',
  variant = 'secondary',
  side = 'left',
  align = 'start',
  sideOffset,
  nested = false,
  className,
  sx,
}: LeadContactPhoneButtonProps) {
  const { box, icon } = SIZE_PX[size];
  const popoverProps = { contact, side, align, sideOffset, nested };

  const buttonSx: SxProps<Theme> = [
    {
      width: box,
      height: box,
      flexShrink: 0,
      ...(variant === 'popover'
        ? {
            bgcolor: (theme) => alpha(listifyElevatedSurface(theme), 0.85),
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            },
          }
        : {
            bgcolor: 'secondary.main',
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            },
          }),
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <LeadContactPopover {...popoverProps}>
      <IconButton
        type="button"
        aria-label={`Contatos de ${contact.name}`}
        className={className}
        sx={buttonSx}
      >
        <PhoneOutlinedIcon sx={{ fontSize: icon }} />
      </IconButton>
    </LeadContactPopover>
  );
}
