import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RichTextEditor, type RichTextEditorHandle } from "./rich-text-editor";
import { Button } from "../../atoms/button";

const meta: Meta<typeof RichTextEditor> = {
  title: "Organisms/RichTextEditor",
  component: RichTextEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="flex h-[480px] w-full max-w-3xl flex-col bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

const SAMPLE_VARIABLES = [
  { token: "{{nome_paciente}}", label: "Nome Paciente" },
  { token: "{{valor_contrato}}", label: "Valor do Contrato" },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(
      "<h2>Contrato de Prestação de Serviços</h2><p>Pelo presente instrumento, " +
        '<span data-variable="{{nome_paciente}}" data-label="Nome Paciente">Nome Paciente</span> ' +
        "contrata os serviços descritos a seguir.</p>",
    );
    const editorRef = useRef<RichTextEditorHandle>(null);

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_VARIABLES.map((variable) => (
            <Button
              key={variable.token}
              variant="outline"
              size="sm"
              onClick={() => editorRef.current?.insertVariable(variable)}
            >
              {variable.label}
            </Button>
          ))}
        </div>
        <RichTextEditor ref={editorRef} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const A4Page: Story = {
  render: () => {
    const [value, setValue] = useState(
      "<h2>Contrato</h2><p>Conteúdo renderizado como uma folha A4, " +
        "com margens reais e guias de quebra de página.</p>",
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <RichTextEditor page="a4" value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    value: "<p>Conteúdo somente leitura.</p>",
    onChange: () => {},
    disabled: true,
  },
};
