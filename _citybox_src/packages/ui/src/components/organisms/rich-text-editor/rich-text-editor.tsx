"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Fragment, Slice } from "@tiptap/pm/model";
import { dropPoint } from "@tiptap/pm/transform";

import { cn } from "../../../lib/utils";
import {
  RichTextEditorToolbar,
  type RichTextEditorToolbarVariant,
} from "./rich-text-editor-toolbar";
import { SearchReplaceExtension } from "./search-replace-extension";
import { VariableNode, type EditorVariable } from "./variable-node";

export type { EditorVariable } from "./variable-node";

export type RichTextEditorHandle = {
  /** Insere um chip de variável na posição atual do cursor. */
  insertVariable: (variable: EditorVariable) => void;
  /** Foca a área de edição. */
  focus: () => void;
};

export type RichTextEditorProps = {
  /** Conteúdo em HTML. */
  value: string;
  /** Disparado a cada alteração com o HTML serializado. */
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Rótulo acessível aplicado à área editável (`aria-label`). */
  ariaLabel?: string;
  /**
   * Layout da área de edição:
   * - `"fluid"` (padrão): ocupa a largura disponível.
   * - `"a4"`: simula uma folha A4 (papel branco centralizado, margens reais,
   *   guias de quebra de página e CSS de impressão para sair em A4).
   */
  page?: "fluid" | "a4";
  /**
   * Conjunto de ações da toolbar:
   * - `"full"` (padrão): todas as ações.
   * - `"basic"`: desfazer/refazer + formatação (negrito → justificar).
   */
  toolbar?: RichTextEditorToolbarVariant;
  ref?: Ref<RichTextEditorHandle>;
  /** MIME usado por chips arrastados de fora do editor (ex.: sidebar de variáveis). */
  dropMimeType?: string;
  /** Extrai a variável a partir do `DataTransfer` de um drop externo. */
  parseDropData?: (dataTransfer: DataTransfer) => EditorVariable | null;
};

// Tipografia/listas/placeholder do conteúdo — compartilhado entre os layouts.
const PROSE_CLASS = cn(
  "[&_.ProseMirror]:outline-none",
  "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold",
  "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold",
  "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold",
  "[&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold",
  "[&_.ProseMirror_code]:rounded-md [&_.ProseMirror_code]:border [&_.ProseMirror_code]:border-border/60 [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-[0.9em]",
  "[&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-md",
  "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
  "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
  "[&_.ProseMirror_.rte-search-match]:rounded-sm [&_.ProseMirror_.rte-search-match]:bg-yellow-200/70",
  "[&_.ProseMirror_.rte-search-match-current]:rounded-sm [&_.ProseMirror_.rte-search-match-current]:bg-orange-300/80 [&_.ProseMirror_.rte-search-match-current]:ring-1 [&_.ProseMirror_.rte-search-match-current]:ring-orange-500/50",
);

const FLUID_CONTENT_CLASS = cn(
  "min-h-0 flex-1 overflow-y-auto rounded-b-xl bg-background px-4 py-3 text-base leading-relaxed",
  "[&_.ProseMirror]:min-h-full",
  PROSE_CLASS,
);

// No modo A4 o "papel" (`[data-rte-paper]`) é dimensionado pelo CSS injetado abaixo;
// aqui ficam o canvas cinza rolável e a tipografia de documento.
const A4_CONTENT_CLASS = cn(
  "min-h-0 flex-1 overflow-auto rounded-b-xl bg-muted/40 px-4 py-6 text-[11pt] leading-relaxed",
  PROSE_CLASS,
);

/**
 * CSS do papel A4 + impressão, escopado em `[data-rte-paper]` e injetado apenas
 * quando `page="a4"` — assim as regras de impressão (que escondem o resto da
 * página) só existem enquanto este editor está montado.
 */
const A4_PAPER_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
}
[data-rte-paper] {
  box-sizing: border-box;
  width: 210mm;
  max-width: 100%;
  min-height: 297mm;
  margin: 0 auto;
  padding: 25mm;
  background-color: var(--paper);
  color: var(--paper-foreground);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 10px 30px rgba(0, 0, 0, 0.12);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(297mm - 1px),
    color-mix(in oklch, var(--paper-foreground) 14%, transparent) calc(297mm - 1px),
    color-mix(in oklch, var(--paper-foreground) 14%, transparent) 297mm
  );
  background-origin: border-box;
  background-repeat: repeat-y;
  overflow-wrap: anywhere;
  word-wrap: break-word;
}
[data-rte-paper] img,
[data-rte-paper] table,
[data-rte-paper] pre,
[data-rte-paper] video {
  max-width: 100%;
}
[data-rte-paper] img,
[data-rte-paper] video {
  height: auto;
}
/* Chips de variável: cores neutras sobre o papel branco (independem do tema claro/escuro do app). */
[data-rte-paper] [data-variable] {
  background-color: color-mix(in oklch, var(--paper-foreground) 8%, transparent);
  color: var(--paper-foreground);
  border-color: color-mix(in oklch, var(--paper-foreground) 22%, transparent);
}
@media print {
  body * { visibility: hidden !important; }
  [data-rte-paper], [data-rte-paper] * { visibility: visible !important; }
  [data-rte-paper] {
    position: absolute;
    inset: 0 auto auto 0;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-height: auto;
    margin: 0;
    padding: 18mm;
    box-shadow: none;
    background-image: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }
}
`;

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Comece a escrever…",
  disabled = false,
  className,
  ariaLabel,
  page = "fluid",
  toolbar = "full",
  ref,
  dropMimeType,
  parseDropData,
}: RichTextEditorProps) {
  const isA4 = page === "a4";
  // Refs mantêm callbacks/config "vivos" — as opções do `useEditor` são lidas
  // apenas na construção e não reagem a re-renders (evita stale closures).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const dropMimeTypeRef = useRef(dropMimeType);
  dropMimeTypeRef.current = dropMimeType;
  const parseDropDataRef = useRef(parseDropData);
  parseDropDataRef.current = parseDropData;
  // Último HTML que o editor possui, para a sincronização de `value` não
  // disparar `setContent` em loop por diferenças de serialização.
  const lastHtmlRef = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      VariableNode,
      SearchReplaceExtension,
    ],
    content: value,
    editorProps: {
      attributes: {
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(isA4 ? { "data-rte-paper": "true" } : {}),
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const mime = dropMimeTypeRef.current;
        const parse = parseDropDataRef.current;
        if (!mime || !parse || !event.dataTransfer) return false;

        const variable = parse(event.dataTransfer);
        if (!variable) return false;

        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return false;

        event.preventDefault();
        const node = view.state.schema.nodes.variable.create({
          token: variable.token,
          label: variable.label,
        });
        // `coords.pos` é a posição exata sob o ponteiro; `dropPoint` ajusta para o
        // ponto de inserção válido mais próximo (mesma lógica do drop nativo do PM).
        const slice = new Slice(Fragment.from(node), 0, 0);
        const insertPos = dropPoint(view.state.doc, coords.pos, slice) ?? coords.pos;
        view.dispatch(view.state.tr.insert(insertPos, node).scrollIntoView());
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      lastHtmlRef.current = html;
      onChangeRef.current(html);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      insertVariable: (variable) => {
        editor?.chain().focus().insertVariable(variable).run();
      },
      focus: () => {
        editor?.chain().focus().run();
      },
    }),
    [editor],
  );

  // Sincroniza alterações externas de `value` (ex.: ao abrir um modelo para edição).
  // Compara com o último HTML conhecido (não com `getHTML()`) para evitar loop.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === lastHtmlRef.current) return;
    lastHtmlRef.current = value;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {isA4 ? <style>{A4_PAPER_CSS}</style> : null}
      <RichTextEditorToolbar
        editor={editor}
        disabled={disabled}
        variant={toolbar}
      />
      <EditorContent
        editor={editor}
        className={isA4 ? A4_CONTENT_CLASS : FLUID_CONTENT_CLASS}
      />
    </div>
  );
}
