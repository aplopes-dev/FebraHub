import * as React from "react";
import { useId } from "react";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { Input } from "../../atoms/input";
import { cn } from "../../../lib/utils";

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onSearch?: (value: string) => void;
  containerClassName?: string;
  showSubmitButton?: boolean;
}

export function SearchInput({
  id,
  placeholder = "Buscar...",
  onSearch,
  className,
  containerClassName,
  showSubmitButton = false,
  onChange,
  value,
  defaultValue,
  ...props
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");

  const isControlled = value !== undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.(String(isControlled ? value : internalValue));
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative", containerClassName)}
    >
      {/* Left search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center w-9 text-muted-foreground/80">
        <SearchIcon size={16} aria-hidden="true" />
      </div>

      {/*
        pl-9 pr-9 sobrescreve o px-2.5 do Input base via tailwind-merge
        (physical properties conflitam corretamente com px-*)
      */}
      <Input
        {...props}
        id={inputId}
        type="search"
        value={isControlled ? value : internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "pl-9 bg-secondary placeholder:text-sm",
          showSubmitButton ? "pr-9" : "pr-3",
          className,
        )}
      />

      {/* Right submit button — opcional via showSubmitButton */}
      {showSubmitButton && (
        <button
          type="submit"
          aria-label="Executar busca"
          className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center rounded-r-lg text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRightIcon aria-hidden="true" size={16} />
        </button>
      )}
    </form>
  );
}
