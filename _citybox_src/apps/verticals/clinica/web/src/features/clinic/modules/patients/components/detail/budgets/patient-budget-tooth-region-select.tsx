'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import {
  PATIENT_BUDGET_ALL_TEETH,
  PATIENT_BUDGET_DECIDUOUS_LOWER_LEFT_TEETH,
  PATIENT_BUDGET_DECIDUOUS_LOWER_RIGHT_TEETH,
  PATIENT_BUDGET_DECIDUOUS_UPPER_LEFT_TEETH,
  PATIENT_BUDGET_DECIDUOUS_UPPER_RIGHT_TEETH,
  hofRegionIdsToSelectLabels,
  parsePatientBudgetToothRegionSelectValue,
} from '../../../lib/patient-budget-tooth-numbers';
import { ODONTOGRAM_REGION_LABELS } from '../../../lib/odontogram-regions';
import {
  FACE_ORDER,
  FACE_UI_LABEL,
  HOF_REGIONS,
  type FaceLetter,
} from './odontogram/odontogram-data';

const TRIGGER_CLASS =
  'flex h-auto min-h-9 w-full items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1.5 text-left text-sm font-normal outline-none transition-[color,box-shadow,background-color] hover:bg-input/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

const OPTION_CLASS =
  'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted';

const REGION_LABELS: Record<(typeof ODONTOGRAM_REGION_LABELS)[number], string> = {
  Maxila: 'Maxila',
  Mandíbula: 'Mandíbula',
  Face: 'Face',
  'Arcada superior': 'Arcada Superior',
  'Arcada inferior': 'Arcada Inferior',
  Arcadas: 'Arcadas',
};

const PERMANENT_TEETH = [...PATIENT_BUDGET_ALL_TEETH].sort((a, b) => a - b);

const DECIDUOUS_TEETH = [
  ...PATIENT_BUDGET_DECIDUOUS_UPPER_RIGHT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_UPPER_LEFT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_LOWER_LEFT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_LOWER_RIGHT_TEETH,
].sort((a, b) => a - b);

type SelectOption = {
  value: string;
  label: string;
  group: 'Permanentes' | 'Decíduos' | 'Regiões' | 'HOF';
};

const ALL_OPTIONS: SelectOption[] = [
  ...PERMANENT_TEETH.map((tooth) => ({
    value: String(tooth),
    label: String(tooth),
    group: 'Permanentes' as const,
  })),
  ...DECIDUOUS_TEETH.map((tooth) => ({
    value: String(tooth),
    label: String(tooth),
    group: 'Decíduos' as const,
  })),
  ...ODONTOGRAM_REGION_LABELS.map((region) => ({
    value: region,
    label: REGION_LABELS[region],
    group: 'Regiões' as const,
  })),
  ...HOF_REGIONS.map((region) => ({
    value: region.label,
    label: region.label,
    group: 'HOF' as const,
  })),
];

type SelectedChip = {
  value: string;
  label: string;
};

type PatientBudgetToothRegionSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  toothFaces?: Readonly<Record<number, FaceLetter[]>>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Quando false, oculta opções e chips HOF. Default true. */
  showHof?: boolean;
};

function formatToothBadgeLabel(
  toothNumber: number,
  faces: readonly FaceLetter[] = [],
): string {
  if (faces.length === 0) {
    return String(toothNumber);
  }

  const facesTxt = FACE_ORDER.filter((face) => faces.includes(face))
    .map((face) => FACE_UI_LABEL[face])
    .join('-');

  return `${toothNumber} (${facesTxt})`;
}

function matchesQuery(option: SelectOption, query: string): boolean {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  return (
    option.value.toLowerCase().includes(normalized) ||
    option.label.toLowerCase().includes(normalized) ||
    option.group.toLowerCase().includes(normalized)
  );
}

export function PatientBudgetToothRegionSelect({
  value,
  onChange,
  toothFaces = {},
  disabled = false,
  placeholder = 'Selecionar Dente/Região',
  className,
  showHof = true,
}: PatientBudgetToothRegionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const availableOptions = useMemo(
    () => (showHof ? ALL_OPTIONS : ALL_OPTIONS.filter((option) => option.group !== 'HOF')),
    [showHof],
  );

  const selectedChips = useMemo((): SelectedChip[] => {
    const { toothNumbers, regionLabels, hofRegionIds } =
      parsePatientBudgetToothRegionSelectValue(value);
    return [
      ...toothNumbers.map((toothNumber) => ({
        value: String(toothNumber),
        label: formatToothBadgeLabel(toothNumber, toothFaces[toothNumber] ?? []),
      })),
      ...regionLabels.map((region) => ({
        value: region,
        label:
          region in REGION_LABELS
            ? REGION_LABELS[region as keyof typeof REGION_LABELS]
            : region,
      })),
      ...(showHof
        ? hofRegionIdsToSelectLabels(hofRegionIds).map((label) => ({
            value: label,
            label,
          }))
        : []),
    ];
  }, [showHof, toothFaces, value]);

  const filteredGroups = useMemo(() => {
    const groups: Array<{
      heading: SelectOption['group'];
      options: SelectOption[];
    }> = [
      { heading: 'Permanentes', options: [] },
      { heading: 'Decíduos', options: [] },
      { heading: 'Regiões', options: [] },
      ...(showHof ? [{ heading: 'HOF' as const, options: [] as SelectOption[] }] : []),
    ];

    for (const option of availableOptions) {
      if (!matchesQuery(option, query)) continue;
      const group = groups.find((item) => item.heading === option.group);
      group?.options.push(option);
    }

    return groups.filter((group) => group.options.length > 0);
  }, [availableOptions, query, showHof]);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  };

  const remove = (optionValue: string) => {
    onChange(value.filter((item) => item !== optionValue));
  };

  const visible = selectedChips.slice(0, 4);
  const overflow = selectedChips.length - visible.length;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery('');
        }
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(TRIGGER_CLASS, className)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selectedChips.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visible.map((chip) => (
                  <Badge key={chip.value} variant="default" className="gap-1 pr-1 font-normal">
                    {chip.label}
                    <span
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      className="rounded-sm p-0.5 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                      aria-label={`Remover ${chip.label}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!disabled) {
                          remove(chip.value);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (disabled) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          remove(chip.value);
                        }
                      }}
                    >
                      <X className="size-3" aria-hidden />
                    </span>
                  </Badge>
                ))}
                {overflow > 0 ? <Badge variant="default">+{overflow}</Badge> : null}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className={cn(
          'flex w-[var(--radix-popover-trigger-width)] min-w-[16rem] flex-col gap-0 overflow-hidden p-0',
          'max-h-[min(24rem,var(--radix-popover-content-available-height))]',
          CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar dente ou região..."
            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Buscar dente ou região"
          />
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
          onWheel={(event) => {
            // Sheet/Dialog (RemoveScroll) bloqueia wheel em conteúdo portaled;
            // a barra funciona, mas o mouse não — aplicar o scroll manualmente.
            event.stopPropagation();
            const node = event.currentTarget;
            if (node.scrollHeight <= node.clientHeight) return;
            node.scrollTop += event.deltaY;
          }}
        >
          {filteredGroups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma opção encontrada.
            </p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.heading} className="mb-1.5 last:mb-0">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {group.heading}
                </p>
                {group.options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(OPTION_CLASS, isSelected && 'bg-muted')}
                      onClick={() => toggle(option.value)}
                    >
                      <span className="flex-1">{option.label}</span>
                      <Check
                        className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
