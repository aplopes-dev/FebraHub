"use client";

import { Checkbox } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { CampaignQuestionOption } from "../../campaign-public.model";

interface CustomCheckboxGroupProps {
  id: string;
  label: string;
  helpText?: string;
  required?: boolean;
  options: CampaignQuestionOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  primaryColor?: string;
}

export function CustomCheckboxGroup({
  id,
  label,
  helpText,
  required,
  options,
  value,
  onChange,
  error,
  primaryColor = "#3b82f6",
}: CustomCheckboxGroupProps) {
  const handleToggle = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((v) => v !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <label className="block font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Múltipla escolha — selecione uma ou mais opções
      </p>

      <div
        role="group"
        aria-label={`${label} — múltipla escolha`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText || error ? `${id}-description` : undefined}
        className="space-y-3"
      >
        {options.map((option) => {
          const isChecked = value.includes(option.id);
          const checkboxId = `${id}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={checkboxId}
              className={cn(
                "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-(--primary-color)",
                isChecked
                  ? "border-(--primary-color) bg-(--primary-color)/10"
                  : "border-input bg-background",
              )}
              style={
                {
                  "--primary-color": primaryColor,
                } as React.CSSProperties
              }
            >
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={() => handleToggle(option.id)}
              />
              <span className="flex-1 text-sm font-medium leading-none">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {(helpText || error) && (
        <p
          id={`${id}-description`}
          className={cn(
            "mt-2 text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
}
