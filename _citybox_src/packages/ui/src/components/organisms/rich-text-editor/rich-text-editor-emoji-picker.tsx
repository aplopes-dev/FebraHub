"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Smile } from "lucide-react";

import { Button } from "../../atoms/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms/popover";
import { EMOJI_OPTIONS } from "./rich-text-editor-emoji-options";

type EmojiInsertButtonProps = {
  editor: Editor | null;
  disabled?: boolean;
};

/**
 * Sheets/Dialogs usam react-remove-scroll e bloqueiam `wheel` em popovers
 * portaled no body. Aplicamos o scroll manualmente com listener não-passivo.
 */
function useWheelScrollWhenOpen(
  open: boolean,
  scrollRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    let removeListener: (() => void) | undefined;
    const frame = window.requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;

      const onWheel = (event: WheelEvent) => {
        event.stopPropagation();
        event.preventDefault();
        el.scrollTop += event.deltaY;
        el.scrollLeft += event.deltaX;
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      removeListener = () => el.removeEventListener("wheel", onWheel);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      removeListener?.();
    };
  }, [open, scrollRef]);
}

export function EmojiInsertButton({ editor, disabled }: EmojiInsertButtonProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useWheelScrollWhenOpen(open, scrollRef);

  const insertEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Emoticons"
          title="Emoticons"
          disabled={disabled || !editor}
        >
          <Smile className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[300] w-[min(28rem,calc(100vw-2rem))] max-w-[28rem] overflow-x-hidden p-3"
        onWheel={(event) => event.stopPropagation()}
      >
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Emoticons
        </p>
        <div
          ref={scrollRef}
          className="grid max-h-[min(24rem,55vh)] grid-cols-10 gap-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1"
        >
          {EMOJI_OPTIONS.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              className="flex size-9 items-center justify-center rounded-md text-xl leading-none transition-colors hover:bg-accent"
              aria-label={`Inserir emoji ${index + 1}`}
              onClick={() => insertEmoji(emoji)}
            >
              <span className="select-none">{emoji}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
