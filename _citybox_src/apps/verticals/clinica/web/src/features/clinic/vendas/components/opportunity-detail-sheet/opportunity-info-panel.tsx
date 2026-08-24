"use client";

import { useState } from "react";
import { Phone, MapPin, Calendar, User, List, Pencil, Megaphone } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import { Separator } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import {
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";

import { ORIGIN_OPTIONS } from "../opportunity-sheet/opportunity-form-schema";
import { KanbanCampaignSubmissionSheet } from "../kanban-board/kanban-campaign-submission-sheet";
import { useUpdateOpportunity } from "../../hooks/use-update-opportunity";
import type { KanbanCard } from "../../types";
import type { Opportunity } from "../../services/sales.service";

interface OpportunityInfoPanelProps {
  card: KanbanCard;
  opportunity?: Opportunity;
  isReadOnly?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

// -------------------- Campos editáveis -------------------- //

interface EditableTextProps {
  initialValue: string;
  displayValue: string;
  placeholder: string;
  multiline?: boolean;
  type?: string;
  isReadOnly: boolean;
  onSave: (value: string) => Promise<void>;
}

function EditableText({
  initialValue,
  displayValue,
  placeholder,
  multiline,
  type,
  isReadOnly,
  onSave,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(value);
      setEditing(false);
    } catch {
      /* erro tratado no onSave */
    } finally {
      setIsSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-24"
            autoFocus
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={type}
            placeholder={placeholder}
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialValue);
              setEditing(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-sm">
        {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
      </p>
      {!isReadOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            setValue(initialValue);
            setEditing(true);
          }}
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}

interface EditableOriginProps {
  initialValue: string;
  isReadOnly: boolean;
  onSave: (value: string) => Promise<void>;
}

function EditableOrigin({ initialValue, isReadOnly, onSave }: EditableOriginProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(value);
      setEditing(false);
    } catch {
      /* erro tratado no onSave */
    } finally {
      setIsSaving(false);
    }
  };

  const originLabel =
    ORIGIN_OPTIONS.find((opt) => opt.value === initialValue)?.label || initialValue;

  if (editing) {
    return (
      <div className="space-y-2">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {ORIGIN_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialValue);
              setEditing(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-sm">
        {originLabel || (
          <span className="text-muted-foreground">Adicionar origem</span>
        )}
      </p>
      {!isReadOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            setValue(initialValue);
            setEditing(true);
          }}
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}

interface EditableDateProps {
  initialValue?: Date;
  isReadOnly: boolean;
  onSave: (value: Date | undefined) => Promise<void>;
}

function EditableDate({ initialValue, isReadOnly, onSave }: EditableDateProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<Date | undefined>(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(value);
      setEditing(false);
    } catch {
      /* erro tratado no onSave */
    } finally {
      setIsSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <DatePicker value={value} onChange={setValue} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialValue);
              setEditing(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-sm">
        {initialValue ? (
          formatDate(initialValue)
        ) : (
          <span className="text-muted-foreground">Adicionar próximo contato</span>
        )}
      </p>
      {!isReadOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            setValue(initialValue);
            setEditing(true);
          }}
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}

// -------------------- Painel -------------------- //

export function OpportunityInfoPanel({
  card,
  opportunity,
  isReadOnly = false,
}: OpportunityInfoPanelProps) {
  const updateOpportunity = useUpdateOpportunity();
  const [submissionSheetOpen, setSubmissionSheetOpen] = useState(false);

  const patientName = opportunity?.patient?.name || card.patientName;
  const patientPhone = opportunity?.patient?.phone || card.phone;
  const patientEmail = opportunity?.patient?.email;

  const currentDescription = opportunity?.description || card.description || "";
  const currentPhone = !card.patientName
    ? opportunity?.phone || card.phone || ""
    : "";
  const currentOrigin = opportunity?.origin || card.origin || "";
  const currentNextContact = opportunity?.nextContact || card.nextContact;
  const submissionId = opportunity?.submissionId ?? card.submissionId;
  const campaignName = opportunity?.campaign?.name ?? card.campaignName;

  const saveField = async (
    data: Parameters<typeof updateOpportunity.mutateAsync>[0]["data"],
    successMessage: string,
    errorMessage: string,
  ) => {
    try {
      await updateOpportunity.mutateAsync({ id: card.id, data });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Paciente vinculado */}
      {patientName && (
        <>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={card.patientAvatar} alt={patientName} />
              <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{patientName}</p>
              {patientPhone && (
                <p className="text-sm text-muted-foreground">
                  {formatPhone(patientPhone)}
                </p>
              )}
              {patientEmail && (
                <p className="text-sm text-muted-foreground">{patientEmail}</p>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Informações */}
      <div className="space-y-3">
        {card.createdBy && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">
              <User className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Criado por</p>
              <p className="text-sm">{card.createdBy.name}</p>
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className="group flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">
            <List className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Descrição</p>
            <EditableText
              initialValue={currentDescription}
              displayValue={currentDescription}
              placeholder="Adicionar descrição"
              multiline
              isReadOnly={isReadOnly}
              onSave={(value) =>
                saveField(
                  { description: value || undefined },
                  "Descrição atualizada com sucesso!",
                  "Erro ao atualizar descrição",
                )
              }
            />
          </div>
        </div>

        {/* Telefone (apenas sem paciente vinculado) */}
        {!card.patientName && (
          <div className="group flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">
              <Phone className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Telefone</p>
              <EditableText
                initialValue={currentPhone}
                displayValue={formatPhone(currentPhone)}
                placeholder="Adicionar telefone"
                type="tel"
                isReadOnly={isReadOnly}
                onSave={(value) =>
                  saveField(
                    { phone: value ? value.replace(/\D/g, "") : undefined },
                    "Telefone atualizado com sucesso!",
                    "Erro ao atualizar telefone",
                  )
                }
              />
            </div>
          </div>
        )}

        {/* Origem */}
        <div className="group flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">
            <MapPin className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Origem</p>
            <EditableOrigin
              initialValue={currentOrigin}
              isReadOnly={isReadOnly}
              onSave={(value) =>
                saveField(
                  { origin: value || undefined },
                  "Origem atualizada com sucesso!",
                  "Erro ao atualizar origem",
                )
              }
            />
          </div>
        </div>

        {card.label && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: card.label.color }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Rótulo</p>
              <p className="text-sm">{card.label.name}</p>
            </div>
          </div>
        )}

        {/* Próximo contato */}
        <div className="group flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">
            <Calendar className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Próximo contato</p>
            <EditableDate
              initialValue={
                currentNextContact ? new Date(currentNextContact) : undefined
              }
              isReadOnly={isReadOnly}
              onSave={(value) =>
                saveField(
                  { nextContact: value || undefined },
                  "Próximo contato atualizado com sucesso!",
                  "Erro ao atualizar próximo contato",
                )
              }
            />
          </div>
        </div>

        {submissionId && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              {campaignName && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <Megaphone className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Campanha</p>
                    <p className="text-sm">{campaignName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                  <List className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Resposta do Formulário
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setSubmissionSheetOpen(true)}
                  >
                    Ver resposta
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <KanbanCampaignSubmissionSheet
        submissionId={submissionId}
        open={submissionSheetOpen}
        onOpenChange={setSubmissionSheetOpen}
      />
    </div>
  );
}
