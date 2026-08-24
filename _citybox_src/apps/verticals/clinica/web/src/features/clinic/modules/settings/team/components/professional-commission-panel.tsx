'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Accordion, Button } from '@citybox/ui/atoms';
import { createEmptyCommissionRule } from '../data/commission-defaults';
import {
  findExistingBudgetApprovedRule,
  findMatchingCommissionRule,
  patchTouchesCommissionIdentity,
  prefillCommissionRuleFromExisting,
} from '../lib/commission-rule-identity';
import { isFixedValueSpecialtyMissingTreatments } from '../lib/fixed-value-specialty-readiness';
import { useCommissionPlanSpecialties } from '../lib/use-commission-plan-specialties';
import {
  COMMISSION_SCOPE_ALL,
  COMMISSION_TYPE_LABELS,
  PAYMENT_TRIGGER_LABELS,
  type CommissionRule,
} from '../types/commission';
import { CommissionRuleItem, COMMISSION_RULE_ACTION_SLOT_CLASS, COMMISSION_RULE_GRID_CLASS, COMMISSION_RULE_ROW_CLASS } from './commission-rule-item';
import { CommissionRuleFields } from './commission-rule-fields';
import { cn } from '@citybox/ui';

type SortKey = 'paymentTrigger' | 'planId' | 'specialtyId' | 'commissionType';
type SortDir = 'asc' | 'desc';

type ProfessionalCommissionPanelProps = {
  commissionRules: CommissionRule[];
  disabled?: boolean;
  onAdd: (rule: CommissionRule) => void;
  onUpdate: (ruleId: string, patch: Partial<CommissionRule>) => void;
  onRemove: (ruleId: string) => void;
};

function getSortLabel(rule: CommissionRule, key: SortKey): string {
  switch (key) {
    case 'paymentTrigger':
      return rule.paymentTrigger
        ? PAYMENT_TRIGGER_LABELS[rule.paymentTrigger]
        : '';
    case 'commissionType':
      return rule.commissionType
        ? COMMISSION_TYPE_LABELS[rule.commissionType]
        : '';
    case 'planId':
      return rule.planId === COMMISSION_SCOPE_ALL ? 'Todos' : rule.planId;
    case 'specialtyId':
      return rule.specialtyId === COMMISSION_SCOPE_ALL
        ? 'Todos'
        : rule.specialtyId;
  }
}

function SortIcon({ columnKey, sortKey, sortDir }: { columnKey: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== columnKey) {
    return <ArrowDownUp className="size-3 opacity-40" aria-hidden />;
  }
  return sortDir === 'asc'
    ? <ArrowUp className="size-3" aria-hidden />
    : <ArrowDown className="size-3" aria-hidden />;
}

export function ProfessionalCommissionPanel({
  commissionRules,
  disabled = false,
  onAdd,
  onUpdate,
  onRemove,
}: ProfessionalCommissionPanelProps) {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<CommissionRule | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const savedRules = useMemo(() => commissionRules.filter((r) => r.saved), [commissionRules]);

  const sortedRules = useMemo(() => {
    if (!sortKey) return savedRules;
    return [...savedRules].sort((a, b) => {
      const aVal = getSortLabel(a, sortKey).toLowerCase();
      const bVal = getSortLabel(b, sortKey).toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [savedRules, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const handleOpenForm = useCallback(() => {
    setDraft(createEmptyCommissionRule(crypto.randomUUID()));
  }, []);

  const matchingSavedRule = useMemo(() => {
    if (!draft) return undefined;
    if (draft.paymentTrigger === 'budget_approved') {
      return findExistingBudgetApprovedRule(savedRules);
    }
    return findMatchingCommissionRule(savedRules, draft);
  }, [draft, savedRules]);

  const handleDraftUpdate = useCallback(
    (patch: Partial<CommissionRule>) => {
      setDraft((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        if (!patchTouchesCommissionIdentity(patch)) return next;

        if (next.paymentTrigger === 'budget_approved') {
          const budgetMatch = findExistingBudgetApprovedRule(savedRules);
          if (!budgetMatch) return next;
          return prefillCommissionRuleFromExisting(next, budgetMatch);
        }

        const match = findMatchingCommissionRule(savedRules, next);
        if (!match) return next;
        return prefillCommissionRuleFromExisting(next, match);
      });
    },
    [savedRules],
  );

  const draftPlanIsAll = draft?.planId === COMMISSION_SCOPE_ALL;
  const { specialties, isLoading: isSpecialtiesLoading } =
    useCommissionPlanSpecialties(
      draftPlanIsAll ? COMMISSION_SCOPE_ALL : (draft?.planId ?? ''),
    );

  const draftNeedsSpecialtyTreatmentsCheck =
    !!draft &&
    draft.commissionType === 'fixed_value' &&
    (draft.paymentTrigger === 'treatment_completed' ||
      draft.paymentTrigger === 'debit_received') &&
    Boolean(draft.planId.trim()) &&
    Boolean(draft.specialtyId.trim()) &&
    draft.planId !== COMMISSION_SCOPE_ALL &&
    draft.specialtyId !== COMMISSION_SCOPE_ALL;

  const draftSpecialtyMissingTreatments =
    !!draft &&
    !isSpecialtiesLoading &&
    isFixedValueSpecialtyMissingTreatments(
      draft,
      specialties.find((s) => s.id === draft.specialtyId) ?? null,
    );

  const blockAddForSpecialtyTreatments =
    draftSpecialtyMissingTreatments ||
    (draftNeedsSpecialtyTreatmentsCheck && isSpecialtiesLoading);

  const handleAddRule = useCallback(() => {
    if (!draft) return;
    if (!draft.paymentTrigger || !draft.commissionType) return;

    if (blockAddForSpecialtyTreatments) return;

    const match =
      draft.paymentTrigger === 'budget_approved'
        ? findExistingBudgetApprovedRule(savedRules)
        : findMatchingCommissionRule(savedRules, draft);

    if (match) {
      onUpdate(match.id, {
        paymentTrigger: draft.paymentTrigger,
        commissionType: draft.commissionType,
        percentageValue: draft.percentageValue,
        commissionValueBrl: draft.commissionValueBrl,
        allowValueExceedsTreatment: draft.allowValueExceedsTreatment,
        planId: draft.planId,
        specialtyId: draft.specialtyId,
        treatmentCommissionValues: draft.treatmentCommissionValues,
      });
      setOpenItem(match.id);
      setDraft(null);
      return;
    }

    const ruleToSave: CommissionRule = { ...draft, saved: true };
    onAdd(ruleToSave);
    setOpenItem(undefined);
    setDraft(null);
  }, [blockAddForSpecialtyTreatments, draft, onAdd, onUpdate, savedRules]);

  const canAddDraft =
    !!draft?.paymentTrigger &&
    !!draft?.commissionType &&
    !blockAddForSpecialtyTreatments;

  const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'paymentTrigger', label: 'Quando paga' },
    { key: 'planId',         label: 'Plano' },
    { key: 'specialtyId',    label: 'Especialidade' },
    { key: 'commissionType', label: 'Tipo' },
  ];

  return (
    <div className="space-y-6">
      {/* Formulário de nova regra — sempre acima da lista */}
      {draft ? (
        <div className="space-y-4">
          <CommissionRuleFields
            rule={draft}
            existingRules={savedRules}
            disabled={disabled}
            onUpdate={handleDraftUpdate}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled || !canAddDraft}
            onClick={handleAddRule}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            {matchingSavedRule ? 'Atualizar regra existente' : 'Adicionar regra'}
          </Button>
        </div>
      ) : null}

      {/* Botão principal — só quando não há regras salvas nem formulário aberto */}
      {!draft && savedRules.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={handleOpenForm}
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Adicionar regra de comissão
        </Button>
      ) : null}

      {/* Regras já cadastradas — abaixo do formulário */}
      {savedRules.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Regras de comissão ({savedRules.length})
            </p>
            {!draft ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleOpenForm}
                className="gap-1.5"
              >
                <Plus className="size-3.5" aria-hidden />
                Nova regra
              </Button>
            ) : null}
          </div>

          <div className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[40rem] space-y-2 pb-1">
              <div className={cn(COMMISSION_RULE_ROW_CLASS, "pb-1")}>
                <div className={COMMISSION_RULE_GRID_CLASS}>
                  {COLUMNS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSort(key)}
                      className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="truncate">{label}</span>
                      <SortIcon columnKey={key} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  ))}
                </div>
                <div className={COMMISSION_RULE_ACTION_SLOT_CLASS} aria-hidden />
              </div>

              <Accordion
                type="single"
                collapsible
                value={openItem}
                onValueChange={setOpenItem}
                className="space-y-2"
              >
                {sortedRules.map((rule) => (
                  <CommissionRuleItem
                    key={rule.id}
                    rule={rule}
                    disabled={disabled}
                    onUpdate={(patch) => onUpdate(rule.id, patch)}
                    onRemove={() => {
                      onRemove(rule.id);
                      if (openItem === rule.id) setOpenItem(undefined);
                    }}
                  />
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
