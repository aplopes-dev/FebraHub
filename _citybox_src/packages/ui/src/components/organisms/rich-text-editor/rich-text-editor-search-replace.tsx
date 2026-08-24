"use client";

import type { Editor } from "@tiptap/react";
import { ChevronLeft, ChevronRight, Replace, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/button";
import { Input } from "../../atoms/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../atoms/popover";
import { Separator } from "../../atoms/separator";
import { useEditorRerender } from "./rich-text-editor-toolbar-utils";

type SearchReplaceToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
};

function formatMatchCounter(currentIndex: number, total: number): string {
  if (total === 0) return "0/0";
  return `${currentIndex + 1}/${total}`;
}

export function SearchReplaceToolbar({ editor, disabled }: SearchReplaceToolbarProps) {
  useEditorRerender(editor);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  const storage = editor?.storage.searchReplace;
  const totalMatches = storage?.results.length ?? 0;
  const currentIndex = storage?.currentIndex ?? -1;

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open || !editor) return;
    editor.commands.setSearchTerm(searchTerm);
  }, [editor, open, searchTerm]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceTerm);
  }, [editor, replaceTerm]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setShowReplace(false);
      editor?.commands.clearSearch();
      setSearchTerm("");
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || !editor}
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs font-normal",
            open && "bg-accent text-accent-foreground",
          )}
          aria-label="Buscar e substituir"
          title="Buscar e Substituir"
        >
          <Replace className="size-3.5" aria-hidden />
          <span>Buscar e Substituir</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="z-[300] w-auto min-w-[320px] gap-0 rounded-xl p-2 shadow-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (event.shiftKey) {
                    editor?.commands.previousSearchResult();
                  } else {
                    editor?.commands.nextSearchResult();
                  }
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  handleClose();
                }
              }}
              placeholder="Buscar..."
              className="h-8 flex-1 text-sm"
              aria-label="Buscar no documento"
            />

            <span className="w-10 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
              {formatMatchCounter(currentIndex, totalMatches)}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0"
              aria-label="Resultado anterior"
              title="Anterior"
              disabled={!editor || totalMatches === 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor?.commands.previousSearchResult()}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0"
              aria-label="Próximo resultado"
              title="Próximo"
              disabled={!editor || totalMatches === 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor?.commands.nextSearchResult()}
            >
              <ChevronRight className="size-4" />
            </Button>

            <Separator orientation="vertical" className="mx-0.5 h-6" />

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn("size-8 shrink-0", showReplace && "bg-accent text-accent-foreground")}
              aria-label="Substituir"
              aria-pressed={showReplace}
              title="Substituir"
              disabled={!editor}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowReplace((value) => !value)}
            >
              <Replace className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0"
              aria-label="Fechar busca"
              title="Fechar"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClose}
            >
              <X className="size-4" />
            </Button>
          </div>

          {showReplace ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={replaceTerm}
                onChange={(event) => setReplaceTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    editor?.commands.replaceCurrentMatch();
                  }
                }}
                placeholder="Substituir por..."
                className="h-8 flex-1 text-sm"
                aria-label="Substituir por"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs"
                disabled={!editor || totalMatches === 0}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor?.commands.replaceCurrentMatch()}
              >
                Substituir
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
