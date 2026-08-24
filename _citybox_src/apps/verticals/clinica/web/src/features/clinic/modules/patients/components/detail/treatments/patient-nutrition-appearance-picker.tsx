"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import {
  NUTRITION_APPEARANCE_LEVELS,
  nutritionAppearanceSilhouetteSrc,
} from "../../../lib/nutrition-appearance";
import type { PatientImcSilhouetteSex } from "@/lib/patient-imc";
import type { PatientNutritionAppearanceLevel } from "../../../types/patient-nutrition-body";

const FIRST_LEVEL = NUTRITION_APPEARANCE_LEVELS[0];
const LAST_LEVEL =
  NUTRITION_APPEARANCE_LEVELS[NUTRITION_APPEARANCE_LEVELS.length - 1];

/**
 * Empilhamento tipo baralho: cada passo encolhe o card, o que mantém o rodapé
 * com o número sempre visível acima do card da frente.
 */
const CARD_SPACING_PX = 120;
const SCALE_STEP = 0.09;
const OPACITY_STEP = 0.05;

function scaleAt(distance: number): number {
  return Math.max(0.2, 1 - distance * SCALE_STEP);
}

/** Deslocamento acumulado, proporcional à escala, para dar profundidade. */
function offsetPx(offset: number): number {
  const direction = Math.sign(offset);
  let total = 0;

  for (let step = 1; step <= Math.abs(offset); step += 1) {
    total += CARD_SPACING_PX * scaleAt(step - 1);
  }

  return total * direction;
}

function cardStyle(offset: number) {
  const distance = Math.abs(offset);

  return {
    transform: `translate(-50%, -50%) translateX(${offsetPx(offset)}px) scale(${scaleAt(distance)})`,
    opacity: Math.max(0.4, 1 - distance * OPACITY_STEP),
    zIndex: NUTRITION_APPEARANCE_LEVELS.length - distance,
  };
}

type PatientNutritionAppearancePickerProps = {
  value: PatientNutritionAppearanceLevel | "";
  sex: PatientImcSilhouetteSex;
  label: string;
  disabled?: boolean;
  onChange: (value: PatientNutritionAppearanceLevel | "") => void;
};

export function PatientNutritionAppearancePicker({
  value,
  sex,
  label,
  disabled = false,
  onChange,
}: PatientNutritionAppearancePickerProps) {
  /** Card no centro da pilha; as setas só navegam, quem escolhe é o clique. */
  const [focusedLevel, setFocusedLevel] =
    useState<PatientNutritionAppearanceLevel>(value || FIRST_LEVEL);

  useEffect(() => {
    if (value) setFocusedLevel(value);
  }, [value]);

  const step = (offset: number) => {
    const next = focusedLevel + offset;
    if (next < FIRST_LEVEL || next > LAST_LEVEL) return;
    setFocusedLevel(next as PatientNutritionAppearanceLevel);
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative z-10 shrink-0"
        aria-label={`${label}: silhueta anterior`}
        disabled={disabled || focusedLevel === FIRST_LEVEL}
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>

      <div className="relative h-80 flex-1 overflow-hidden">
        {NUTRITION_APPEARANCE_LEVELS.map((level) => {
          const isSelected = level === value;

          return (
            <button
              key={level}
              type="button"
              aria-label={`${label}: silhueta ${level}`}
              aria-pressed={isSelected}
              disabled={disabled}
              style={cardStyle(level - focusedLevel)}
              className={cn(
                "absolute top-1/2 left-1/2 overflow-hidden rounded-xl border-6 border-transparent bg-muted transition-all duration-300",
                isSelected && "border-primary",
              )}
              onClick={() => {
                setFocusedLevel(level);
                onChange(isSelected ? "" : level);
              }}
            >
              {/* SVG estático em /public — <img> evita bloqueio do next/image com .svg */}
              <img
                src={nutritionAppearanceSilhouetteSrc(level, sex)}
                alt=""
                aria-hidden
                className="h-56 w-auto px-4 pt-4"
              />
              <span
                className={cn(
                  "block py-0.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {level}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative z-10 shrink-0"
        aria-label={`${label}: próxima silhueta`}
        disabled={disabled || focusedLevel === LAST_LEVEL}
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
