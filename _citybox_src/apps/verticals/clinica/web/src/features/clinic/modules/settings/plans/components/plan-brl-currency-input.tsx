'use client';

import type { ComponentProps } from 'react';
import { Input } from '@citybox/ui/atoms';
import {
  EMPTY_BRL_CURRENCY,
  ensureBrlCurrencyDisplay,
  formatBrlCurrencyInput,
} from '../lib/format-brl-currency';

type PlanBrlCurrencyInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function PlanBrlCurrencyInput({
  value,
  onValueChange,
  placeholder = EMPTY_BRL_CURRENCY,
  inputMode = 'numeric',
  ...props
}: PlanBrlCurrencyInputProps) {
  return (
    <Input
      {...props}
      inputMode={inputMode}
      value={ensureBrlCurrencyDisplay(value)}
      placeholder={placeholder}
      onChange={(event) => onValueChange(formatBrlCurrencyInput(event.target.value))}
    />
  );
}
