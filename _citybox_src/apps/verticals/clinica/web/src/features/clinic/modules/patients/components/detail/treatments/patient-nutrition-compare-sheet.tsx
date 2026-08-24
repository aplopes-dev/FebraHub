'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import { patientGenderToImcSilhouetteSex } from '@/lib/patient-imc';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { usePatientNutritionInitiationQuery } from '../../../hooks/use-patient-treatments-queries';
import {
  parseNutritionBody,
  toPatientGender,
} from '../../../lib/nutrition-body-composition';
import {
  formatNutritionEvolutionDate,
  formatNutritionEvolutionTime,
} from '../../../lib/patient-nutrition-evolution-card';
import {
  buildNutritionComparison,
  formatNutritionCompareDelta,
  type NutritionCompareCell,
} from '../../../lib/patient-nutrition-compare';

/** Atendimento nutricional já salvo, como aparece no seletor de cada lado. */
export type PatientNutritionCompareAttendance = {
  evolutionId: string;
  initiatedAt: string;
  treatmentName: string;
  professionalName: string;
};

type PatientNutritionCompareSheetProps = {
  open: boolean;
  patientId: string;
  patientGender?: string | null;
  attendances: readonly PatientNutritionCompareAttendance[];
  /** Atendimento que abriu a comparação — entra pré-selecionado à esquerda. */
  defaultEvolutionId?: string | null;
  onOpenChange: (open: boolean) => void;
};

function attendanceLabel(attendance: PatientNutritionCompareAttendance): string {
  return `${formatNutritionEvolutionDate(attendance.initiatedAt)} • ${formatNutritionEvolutionTime(
    attendance.initiatedAt,
  )}`;
}

function CompareCell({ cell }: { cell: NutritionCompareCell | null }) {
  if (!cell) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  if (cell.kind === 'image') {
    return (
      <div className="flex items-center gap-3">
        <img
          src={cell.image}
          alt=""
          aria-hidden
          className="h-20 w-auto rounded-lg bg-muted/50 object-contain p-1"
        />
        <span className="text-sm font-medium text-foreground">{cell.text}</span>
      </div>
    );
  }

  return (
    <p
      className={cn(
        'text-sm text-foreground',
        cell.kind === 'measure'
          ? 'font-medium tabular-nums'
          : 'whitespace-pre-wrap',
      )}
    >
      {cell.text}
    </p>
  );
}

export function PatientNutritionCompareSheet({
  open,
  patientId,
  patientGender,
  attendances,
  defaultEvolutionId = null,
  onOpenChange,
}: PatientNutritionCompareSheetProps) {
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...attendances].sort(
        (a, b) =>
          new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime(),
      ),
    [attendances],
  );

  useEffect(() => {
    if (!open) {
      setLeftId(null);
      setRightId(null);
      return;
    }

    // A variação é lida da esquerda para a direita, então o lado esquerdo recebe
    // o atendimento mais antigo do par.
    const preselected =
      defaultEvolutionId ?? sorted[0]?.evolutionId ?? null;
    const counterpart =
      sorted.find((item) => item.evolutionId !== preselected)?.evolutionId ??
      null;

    const pair = sorted.filter((item) =>
      [preselected, counterpart].includes(item.evolutionId),
    );

    setLeftId(pair[pair.length - 1]?.evolutionId ?? preselected);
    setRightId(pair.length > 1 ? (pair[0]?.evolutionId ?? null) : null);
  }, [defaultEvolutionId, open, sorted]);

  const leftQuery = usePatientNutritionInitiationQuery(patientId, leftId);
  const rightQuery = usePatientNutritionInitiationQuery(patientId, rightId);

  const leftBody = useMemo(
    () => (leftQuery.data ? parseNutritionBody(leftQuery.data.body) : null),
    [leftQuery.data],
  );
  const rightBody = useMemo(
    () => (rightQuery.data ? parseNutritionBody(rightQuery.data.body) : null),
    [rightQuery.data],
  );

  const silhouetteSex = patientGenderToImcSilhouetteSex(
    toPatientGender(patientGender) ?? 'other',
  );

  const groups = useMemo(
    () => buildNutritionComparison(leftBody, rightBody, silhouetteSex),
    [leftBody, rightBody, silhouetteSex],
  );

  const isLoading = leftQuery.isLoading || rightQuery.isLoading;
  const hasSelection = Boolean(leftId) || Boolean(rightId);

  const renderSelect = (
    side: 'left' | 'right',
    value: string | null,
    oppositeValue: string | null,
    onChange: (next: string) => void,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`nutrition-compare-${side}`}>Atendimento</Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger id={`nutrition-compare-${side}`} className="w-full">
          <SelectValue placeholder="Selecione o atendimento" />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((attendance) => (
            <SelectItem
              key={attendance.evolutionId}
              value={attendance.evolutionId}
              disabled={attendance.evolutionId === oppositeValue}
            >
              {attendanceLabel(attendance)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value ? (
        <p className="truncate text-xs text-muted-foreground">
          {sorted.find((item) => item.evolutionId === value)?.treatmentName}
        </p>
      ) : null}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn(
          'flex flex-col gap-0 p-0',
          CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 px-6 pt-5 pb-2">
          <SheetTitle className="font-bold">Comparar atendimentos</SheetTitle>
        </SheetHeader>

        <div className={CLINIC_SHEET_SCROLL_BODY_CLASS}>
          <div className="mx-auto w-full max-w-5xl px-6 pt-2 pb-6">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há atendimentos registrados para comparar.
              </p>
            ) : (
              <div className="relative">
                {/* Divisória central: separa os dois atendimentos de ponta a ponta. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
                />

                <div className="grid grid-cols-2 gap-10">
                  {renderSelect('left', leftId, rightId, setLeftId)}
                  {renderSelect('right', rightId, leftId, setRightId)}
                </div>

                <Separator className="my-5" />

                {!hasSelection ? (
                  <p className="text-sm text-muted-foreground">
                    Selecione um atendimento de cada lado para comparar as
                    métricas.
                  </p>
                ) : isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando atendimentos…
                  </p>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma métrica corporal registrada nos atendimentos
                    selecionados.
                  </p>
                ) : (
                  <div className="space-y-8">
                    {groups.map((group) => (
                      <section key={group.id} className="space-y-1">
                        {/* Título e rótulo saem nos dois lados: cada metade é
                            lida sozinha, sem depender da coluna vizinha. */}
                        <div className="grid grid-cols-2 gap-10">
                          <h3 className="text-base font-semibold text-foreground">
                            {group.title}
                          </h3>
                          <h3 className="text-base font-semibold text-foreground">
                            {group.title}
                          </h3>
                        </div>
                        <div className="divide-y divide-border/60">
                          {group.rows.map((row) => (
                            <div key={row.id} className="grid grid-cols-2 gap-10 py-3">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  {row.label}
                                </p>
                                <div className="mt-1.5">
                                  <CompareCell cell={row.left} />
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  {row.label}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <CompareCell cell={row.right} />
                                  {row.delta != null && row.delta !== 0 ? (
                                    <span
                                      className={cn(
                                        'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                                        row.delta > 0
                                          ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300'
                                          : 'bg-amber-500/20 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
                                      )}
                                    >
                                      {formatNutritionCompareDelta(row.delta)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
