import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type SearchMatch = {
  from: number;
  to: number;
};

export type SearchReplaceStorage = {
  searchTerm: string;
  replaceTerm: string;
  results: SearchMatch[];
  currentIndex: number;
};

export const searchReplacePluginKey = new PluginKey<{
  decorations: DecorationSet;
  results: SearchMatch[];
  currentIndex: number;
}>("searchReplace");

const CURRENT_MATCH_CLASS = "rte-search-match-current";
const MATCH_CLASS = "rte-search-match";

function buildPlainTextIndex(doc: ProseMirrorNode): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (let index = 0; index < node.text.length; index += 1) {
      text += node.text[index];
      map.push(pos + index);
    }
  });

  return { text, map };
}

function offsetToPos(map: number[], offset: number): number {
  if (map.length === 0) return 0;
  if (offset < 0) return map[0] ?? 0;
  if (offset >= map.length) return (map[map.length - 1] ?? 0) + 1;
  return map[offset] ?? 0;
}

export function findSearchMatches(doc: ProseMirrorNode, searchTerm: string): SearchMatch[] {
  const query = searchTerm.trim();
  if (!query) return [];

  const { text, map } = buildPlainTextIndex(doc);
  if (!text) return [];

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const results: SearchMatch[] = [];

  let start = 0;
  while (start <= haystack.length) {
    const found = haystack.indexOf(needle, start);
    if (found === -1) break;

    const from = offsetToPos(map, found);
    const to = offsetToPos(map, found + needle.length - 1) + 1;
    results.push({ from, to });
    start = found + needle.length;
  }

  return results;
}

function buildDecorations(doc: ProseMirrorNode, results: SearchMatch[], currentIndex: number): DecorationSet {
  if (results.length === 0) return DecorationSet.empty;

  return DecorationSet.create(
    doc,
    results.map((match, index) =>
      Decoration.inline(match.from, match.to, {
        class: index === currentIndex ? CURRENT_MATCH_CLASS : MATCH_CLASS,
      }),
    ),
  );
}

function resolvePluginState(state: EditorState, searchTerm: string, currentIndex: number) {
  const results = findSearchMatches(state.doc, searchTerm);
  const safeIndex =
    results.length === 0 ? -1 : Math.min(Math.max(currentIndex, 0), results.length - 1);

  return {
    results,
    currentIndex: safeIndex,
    decorations: buildDecorations(state.doc, results, safeIndex),
  };
}

function scrollMatchIntoView(editor: { view: { dom: HTMLElement; coordsAtPos: (pos: number) => { top: number; bottom: number } | null } }, match: SearchMatch) {
  const coords = editor.view.coordsAtPos(match.from);
  if (!coords) return;

  const scrollParent = editor.view.dom.closest("[class*='overflow']") as HTMLElement | null;
  if (!scrollParent) return;

  const parentRect = scrollParent.getBoundingClientRect();
  const matchTop = coords.top - parentRect.top + scrollParent.scrollTop;
  const matchBottom = coords.bottom - parentRect.top + scrollParent.scrollTop;

  if (matchTop < scrollParent.scrollTop) {
    scrollParent.scrollTop = matchTop - 16;
  } else if (matchBottom > scrollParent.scrollTop + scrollParent.clientHeight) {
    scrollParent.scrollTop = matchBottom - scrollParent.clientHeight + 16;
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      setReplaceTerm: (replaceTerm: string) => ReturnType;
      clearSearch: () => ReturnType;
      nextSearchResult: () => ReturnType;
      previousSearchResult: () => ReturnType;
      replaceCurrentMatch: () => ReturnType;
    };
  }

  interface Storage {
    searchReplace: SearchReplaceStorage;
  }
}

export const SearchReplaceExtension = Extension.create({
  name: "searchReplace",

  addStorage(): SearchReplaceStorage {
    return {
      searchTerm: "",
      replaceTerm: "",
      results: [],
      currentIndex: -1,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ editor, tr, dispatch, state }) => {
          editor.storage.searchReplace.searchTerm = searchTerm;
          editor.storage.searchReplace.currentIndex = searchTerm ? 0 : -1;

          const pluginState = resolvePluginState(state, searchTerm, editor.storage.searchReplace.currentIndex);
          editor.storage.searchReplace.results = pluginState.results;
          editor.storage.searchReplace.currentIndex = pluginState.currentIndex;

          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, {
              searchTerm,
              currentIndex: pluginState.currentIndex,
            });
            dispatch(tr);
          }

          const current = pluginState.results[pluginState.currentIndex];
          if (current) {
            editor.chain().setTextSelection({ from: current.from, to: current.to }).run();
            scrollMatchIntoView(editor, current);
          }

          return true;
        },

      setReplaceTerm:
        (replaceTerm: string) =>
        ({ editor }) => {
          editor.storage.searchReplace.replaceTerm = replaceTerm;
          return true;
        },

      clearSearch:
        () =>
        ({ editor, tr, dispatch, state }) => {
          editor.storage.searchReplace.searchTerm = "";
          editor.storage.searchReplace.results = [];
          editor.storage.searchReplace.currentIndex = -1;

          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { searchTerm: "", currentIndex: -1 });
            dispatch(tr);
          }

          return true;
        },

      nextSearchResult:
        () =>
        ({ editor, tr, dispatch, state }) => {
          const { searchTerm, results, currentIndex } = editor.storage.searchReplace;
          if (!searchTerm || results.length === 0) return false;

          const nextIndex = (currentIndex + 1) % results.length;
          editor.storage.searchReplace.currentIndex = nextIndex;

          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { searchTerm, currentIndex: nextIndex });
            dispatch(tr);
          }

          const current = results[nextIndex];
          if (current) {
            editor.chain().setTextSelection({ from: current.from, to: current.to }).run();
            scrollMatchIntoView(editor, current);
          }

          return true;
        },

      previousSearchResult:
        () =>
        ({ editor, tr, dispatch, state }) => {
          const { searchTerm, results, currentIndex } = editor.storage.searchReplace;
          if (!searchTerm || results.length === 0) return false;

          const previousIndex = (currentIndex - 1 + results.length) % results.length;
          editor.storage.searchReplace.currentIndex = previousIndex;

          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { searchTerm, currentIndex: previousIndex });
            dispatch(tr);
          }

          const current = results[previousIndex];
          if (current) {
            editor.chain().setTextSelection({ from: current.from, to: current.to }).run();
            scrollMatchIntoView(editor, current);
          }

          return true;
        },

      replaceCurrentMatch:
        () =>
        ({ editor, state, dispatch }) => {
          const { results, currentIndex, replaceTerm, searchTerm } = editor.storage.searchReplace;
          const match = results[currentIndex];
          if (!match || !dispatch) return false;

          const tr = state.tr.insertText(replaceTerm, match.from, match.to);
          dispatch(tr);

          editor.commands.setSearchTerm(searchTerm);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: searchReplacePluginKey,
        state: {
          init: (_, state) => {
            const searchTerm = extension.storage.searchTerm;
            return resolvePluginState(state, searchTerm, extension.storage.currentIndex);
          },
          apply: (tr: Transaction, pluginState, _oldState, newState) => {
            const meta = tr.getMeta(searchReplacePluginKey) as
              | { searchTerm?: string; currentIndex?: number }
              | undefined;

            const searchTerm =
              meta?.searchTerm !== undefined ? meta.searchTerm : extension.storage.searchTerm;
            const currentIndex =
              meta?.currentIndex !== undefined
                ? meta.currentIndex
                : extension.storage.currentIndex;

            if (!tr.docChanged && !meta) {
              return pluginState;
            }

            const nextState = resolvePluginState(newState, searchTerm, currentIndex);
            extension.storage.results = nextState.results;
            extension.storage.currentIndex = nextState.currentIndex;
            return nextState;
          },
        },
        props: {
          decorations(state) {
            return searchReplacePluginKey.getState(state)?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
