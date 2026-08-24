"use client";

import { useEffect, useReducer } from "react";
import type { Editor } from "@tiptap/react";

export function useEditorRerender(editor: Editor | null) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => rerender();
    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);
}
