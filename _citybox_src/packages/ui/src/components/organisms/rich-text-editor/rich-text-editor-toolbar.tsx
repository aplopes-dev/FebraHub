"use client";

import { useRef, useState, type ComponentType } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Italic,
  Image as ImageIcon,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms/popover";
import { Separator } from "../../atoms/separator";
import { TextColorAndHighlightPicker } from "./rich-text-editor-color-picker";
import { EmojiInsertButton } from "./rich-text-editor-emoji-picker";
import { SearchReplaceToolbar } from "./rich-text-editor-search-replace";
import { useEditorRerender } from "./rich-text-editor-toolbar-utils";

const TEXT_STYLE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "h1", label: "Título 1" },
  { value: "h2", label: "Título 2" },
  { value: "h3", label: "Título 3" },
  { value: "h4", label: "Título 4" },
] as const;

type TextStyleValue = (typeof TEXT_STYLE_OPTIONS)[number]["value"];

const FONT_FAMILY_OPTIONS = [
  { id: "arial", label: "Arial (Padrão)", css: "Arial, sans-serif" },
  { id: "times-new-roman", label: "Times New Roman", css: '"Times New Roman", serif' },
  { id: "courier-new", label: "Courier New", css: '"Courier New", monospace' },
  { id: "georgia", label: "Georgia", css: "Georgia, serif" },
  { id: "verdana", label: "Verdana", css: "Verdana, sans-serif" },
  { id: "system-ui", label: "System UI", css: "system-ui, sans-serif" },
] as const;

type FontFamilyId = (typeof FONT_FAMILY_OPTIONS)[number]["id"];

const DEFAULT_FONT_FAMILY_ID: FontFamilyId = "system-ui";

function normalizeFontFamily(value: string): string {
  return value.replace(/['"]/g, "").toLowerCase().trim();
}

function resolveFontFamilyId(editor: Editor | null): FontFamilyId {
  if (!editor) return DEFAULT_FONT_FAMILY_ID;

  const fontFamily = editor.getAttributes("textStyle").fontFamily as string | undefined;
  if (!fontFamily) return DEFAULT_FONT_FAMILY_ID;

  const normalized = normalizeFontFamily(fontFamily);
  const match = FONT_FAMILY_OPTIONS.find((option) => {
    const optionCss = normalizeFontFamily(option.css);
    const primaryName = normalizeFontFamily(option.css.split(",")[0] ?? option.css);
    return normalized === optionCss || normalized.startsWith(primaryName);
  });

  return match?.id ?? DEFAULT_FONT_FAMILY_ID;
}

function applyFontFamily(editor: Editor, id: FontFamilyId) {
  const option = FONT_FAMILY_OPTIONS.find((item) => item.id === id);
  if (!option) return;
  editor.chain().focus().setFontFamily(option.css).run();
}

type ToolbarButton = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

type ToolbarGroup = ToolbarButton[];

const GROUPS: ToolbarGroup[] = [
  [
    {
      icon: Bold,
      label: "Negrito",
      isActive: (editor) => editor.isActive("bold"),
      run: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Itálico",
      isActive: (editor) => editor.isActive("italic"),
      run: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: UnderlineIcon,
      label: "Sublinhado",
      isActive: (editor) => editor.isActive("underline"),
      run: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: Strikethrough,
      label: "Tachado",
      isActive: (editor) => editor.isActive("strike"),
      run: (editor) => editor.chain().focus().toggleStrike().run(),
    },
  ],
  [
    {
      icon: List,
      label: "Lista com marcadores",
      isActive: (editor) => editor.isActive("bulletList"),
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Lista numerada",
      isActive: (editor) => editor.isActive("orderedList"),
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
  ],
  [
    {
      icon: AlignLeft,
      label: "Alinhar à esquerda",
      isActive: (editor) => editor.isActive({ textAlign: "left" }),
      run: (editor) => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      icon: AlignCenter,
      label: "Centralizar",
      isActive: (editor) => editor.isActive({ textAlign: "center" }),
      run: (editor) => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      icon: AlignRight,
      label: "Alinhar à direita",
      isActive: (editor) => editor.isActive({ textAlign: "right" }),
      run: (editor) => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      icon: AlignJustify,
      label: "Justificar",
      isActive: (editor) => editor.isActive({ textAlign: "justify" }),
      run: (editor) => editor.chain().focus().setTextAlign("justify").run(),
    },
  ],
];

function getTextStyleValue(editor: Editor | null): TextStyleValue {
  if (!editor) return "normal";

  for (const level of [1, 2, 3, 4] as const) {
    if (editor.isActive("heading", { level })) {
      return `h${level}`;
    }
  }

  return "normal";
}

function applyTextStyle(editor: Editor, value: TextStyleValue) {
  const chain = editor.chain().focus();

  if (value === "normal") {
    chain.setParagraph().run();
    return;
  }

  const level = Number(value.replace("h", "")) as 1 | 2 | 3 | 4;
  chain.setHeading({ level }).run();
}

type TextStyleSelectProps = {
  editor: Editor | null;
  disabled?: boolean;
};

function TextStyleSelect({ editor, disabled }: TextStyleSelectProps) {
  useEditorRerender(editor);

  const value = getTextStyleValue(editor);

  return (
    <Select
      value={value}
      disabled={disabled || !editor}
      onValueChange={(next) => editor && applyTextStyle(editor, next as TextStyleValue)}
    >
      <SelectTrigger
        className="h-8 w-[108px] border-0 bg-transparent text-xs shadow-none"
        aria-label="Estilo de texto"
      >
        <SelectValue placeholder="Normal" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[300] min-w-[220px]">
        {TEXT_STYLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FontFamilySelectProps = {
  editor: Editor | null;
  disabled?: boolean;
};

function FontFamilySelect({ editor, disabled }: FontFamilySelectProps) {
  useEditorRerender(editor);

  const value = resolveFontFamilyId(editor);

  return (
    <Select
      value={value}
      disabled={disabled || !editor}
      onValueChange={(next) => editor && applyFontFamily(editor, next as FontFamilyId)}
    >
      <SelectTrigger
        className="h-8 w-[148px] border-0 bg-transparent px-2 text-xs shadow-none"
        aria-label="Família da fonte"
      >
        <Type className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder="System UI" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[300] min-w-[240px]">
        {FONT_FAMILY_OPTIONS.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span style={{ fontFamily: option.css }}>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CodeFormatButtonProps = {
  editor: Editor | null;
  disabled?: boolean;
};

function CodeFormatButton({ editor, disabled }: CodeFormatButtonProps) {
  useEditorRerender(editor);

  const active = editor?.isActive("code") ?? false;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Código"
      aria-pressed={active}
      title="Código"
      disabled={disabled || !editor}
      className={cn(active && "bg-accent text-accent-foreground")}
      onClick={() => editor?.chain().focus().toggleCode().run()}
    >
      <Code className="size-4" />
    </Button>
  );
}

type ImageInsertButtonProps = {
  editor: Editor | null;
  disabled?: boolean;
};

const IMAGE_ACCEPT = "image/svg+xml,image/png,image/jpeg,image/gif,.svg,.png,.jpg,.jpeg,.gif";

function insertImageFile(editor: Editor, file: File, onComplete?: () => void) {
  if (!file.type.startsWith("image/") && !file.name.match(/\.(svg|png|jpe?g|gif)$/i)) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== "string") return;
    editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
    onComplete?.();
  };
  reader.readAsDataURL(file);
}

function ImageInsertButton({ editor, disabled }: ImageInsertButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;
    insertImageFile(editor, file, () => setOpen(false));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !editor) return;
    insertImageFile(editor, file, () => setOpen(false));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Imagem"
          title="Imagem"
          disabled={disabled || !editor}
        >
          <ImageIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[300] w-80 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Enviar imagem"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60">
            <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm text-foreground">Clique para enviar ou arraste e solte</p>
          <p className="text-xs text-muted-foreground">SVG, PNG, JPG ou GIF</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type RichTextEditorToolbarVariant = "full" | "basic";

type RichTextEditorToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
  /**
   * `"basic"` mantém apenas desfazer/refazer e os grupos de formatação
   * (negrito → justificar), sem estilo/fonte, código, emoji, imagem, cor e busca.
   */
  variant?: RichTextEditorToolbarVariant;
};

export function RichTextEditorToolbar({
  editor,
  disabled,
  variant = "full",
}: RichTextEditorToolbarProps) {
  const isFull = variant === "full";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/30 px-2 py-1.5">
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Desfazer"
          title="Desfazer"
          disabled={disabled || !editor}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Refazer"
          title="Refazer"
          disabled={disabled || !editor}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </Button>
      </div>

      {isFull ? (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />

          <TextStyleSelect editor={editor} disabled={disabled} />

          <FontFamilySelect editor={editor} disabled={disabled} />

          <CodeFormatButton editor={editor} disabled={disabled} />
        </>
      ) : null}

      {GROUPS.map((group) => (
        <div key={group[0].label} className="flex items-center gap-0.5">
          <Separator orientation="vertical" className="mx-1 h-6" />
          {group.map((button) => {
            const active = editor ? (button.isActive?.(editor) ?? false) : false;

            return (
              <Button
                key={button.label}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={button.label}
                aria-pressed={active}
                title={button.label}
                disabled={disabled || !editor}
                className={cn(active && "bg-accent text-accent-foreground")}
                onClick={() => editor && button.run(editor)}
              >
                <button.icon className="size-4" />
              </Button>
            );
          })}
        </div>
      ))}

      {isFull ? (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <EmojiInsertButton editor={editor} disabled={disabled} />
          <ImageInsertButton editor={editor} disabled={disabled} />
          <TextColorAndHighlightPicker editor={editor} disabled={disabled} />

          <div className="ml-auto flex shrink-0 items-center pl-1">
            <SearchReplaceToolbar editor={editor} disabled={disabled} />
          </div>
        </>
      ) : null}
    </div>
  );
}
