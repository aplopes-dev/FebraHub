"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button, Input } from "@citybox/ui/atoms";

interface SearchToggleButtonProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchToggleButton({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchToggleButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleToggle = () => {
    if (isExpanded && value) {
      onChange("");
    }
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    onChange("");
    setIsExpanded(false);
  };

  const handleBlur = () => {
    if (!value) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className={className}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
          <Search aria-hidden="true" size={16} />
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="ps-9 pe-9"
        />
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
