"use client";

import { RadioGroup, RadioGroupItem } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { CampaignQuestionOption } from "../../campaign-public.model";

interface CustomRadioGroupProps {
  id: string;
  label: string;
  helpText?: string;
  required?: boolean;
  options: CampaignQuestionOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  primaryColor?: string;
}

export function CustomRadioGroup({
  id,
  label,
  helpText,
  required,
  options,
  value,
  onChange,
  error,
  primaryColor = "#3b82f6",
}: CustomRadioGroupProps) {
  return (
    <div className="w-full">
      <label className="block font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Escolha única — selecione uma opção
      </p>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText || error ? `${id}-description` : undefined}
        className="gap-3"
      >
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={`${id}-${option.id}`}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-full border-2 cursor-pointer transition-all",
              "hover:border-(--primary-color)",
              value === option.id
                ? "border-(--primary-color) bg-(--primary-color)/10"
                : "border-input bg-background",
            )}
            style={
              {
                "--primary-color": primaryColor,
              } as React.CSSProperties
            }
          >
            <RadioGroupItem value={option.id} id={`${id}-${option.id}`} />
            <span className="flex-1 text-sm font-medium leading-none">
              {option.label}
            </span>
          </label>
        ))}
      </RadioGroup>

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
