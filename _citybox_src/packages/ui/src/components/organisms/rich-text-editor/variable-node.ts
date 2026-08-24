import { mergeAttributes, Node } from "@tiptap/core";

export type EditorVariable = {
  /** Token serializado no HTML/saída final, ex.: `{{nome_paciente}}`. */
  token: string;
  /** Rótulo exibido no chip, ex.: `Nome Paciente`. */
  label: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    variable: {
      /** Insere um chip de variável na posição atual do cursor. */
      insertVariable: (variable: EditorVariable) => ReturnType;
    };
  }
}

const VARIABLE_CHIP_CLASS =
  "inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 align-baseline text-sm font-medium text-primary";

/**
 * Nó atômico que representa uma variável de template (ex.: contrato da clínica).
 * Renderiza como um chip não editável e serializa para `<span data-variable="{{token}}">`,
 * permitindo round-trip do HTML salvo (`parseHTML` reidrata o chip ao reabrir o modelo).
 */
export const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      token: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-variable") ?? "",
        renderHTML: (attributes) => ({ "data-variable": attributes.token }),
      },
      label: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-label") ?? element.textContent ?? "",
        renderHTML: (attributes) => ({ "data-label": attributes.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: VARIABLE_CHIP_CLASS }),
      node.attrs.label,
    ];
  },

  renderText({ node }) {
    return node.attrs.token;
  },

  addCommands() {
    return {
      insertVariable:
        (variable) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { token: variable.token, label: variable.label },
          }),
    };
  },
});
