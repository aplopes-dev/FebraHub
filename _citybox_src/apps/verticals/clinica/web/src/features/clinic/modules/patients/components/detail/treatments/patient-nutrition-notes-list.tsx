'use client';

import { Paperclip, Pencil } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { formatNutritionEvolutionDate } from '../../../lib/patient-nutrition-evolution-card';
import type { PatientNutritionNote } from '../../../types/patient-nutrition-note';

type PatientNutritionNotesListProps = {
  notes: readonly PatientNutritionNote[];
  onEdit?: (note: PatientNutritionNote) => void;
};

/** Notas do atendimento, sempre no fim do sheet e em ordem cronológica. */
export function PatientNutritionNotesList({
  notes,
  onEdit,
}: PatientNutritionNotesListProps) {
  if (notes.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Notas</h2>

      <div className="space-y-3">
        {notes.map((note) => (
          <article
            key={note.id}
            className="space-y-2 rounded-2xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {formatNutritionEvolutionDate(note.createdAt)}
              </p>
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Editar nota"
                  onClick={() => onEdit(note)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>

            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {note.attachment?.contentUrl ? (
              <a
                href={note.attachment.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Paperclip className="size-4" aria-hidden />
                {note.attachment.name}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
