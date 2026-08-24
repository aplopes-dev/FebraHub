'use client';

import type { ComponentProps } from 'react';
import { cn } from '@citybox/ui';
import { Switch } from '@citybox/ui/atoms';

/** Switch mais estreito e com thumb circular — evita o aspecto achatado do padrão. */
const CLINIC_COMPACT_SWITCH_CLASS =
  'data-[size=default]:!h-5 data-[size=default]:!w-9 [&_[data-slot=switch-thumb]]:!size-4 [&_[data-slot=switch-thumb]]:data-checked:!translate-x-4';

export function ClinicCompactSwitch({
  className,
  ...props
}: ComponentProps<typeof Switch>) {
  return <Switch className={cn(CLINIC_COMPACT_SWITCH_CLASS, className)} {...props} />;
}
