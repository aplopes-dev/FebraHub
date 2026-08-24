import type { Meta, StoryObj } from "@storybook/react"
import { InputField } from "./form-field"

const meta: Meta<typeof InputField> = {
  title: "Molecules/InputField",
  component: InputField,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    hint: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
}

export default meta
type Story = StoryObj<typeof InputField>

export const Default: Story = {
  args: {
    label: "Nome do produto",
    placeholder: "Ex: Pizza Margherita",
  },
}

export const Required: Story = {
  args: {
    label: "Email",
    placeholder: "seu@email.com",
    required: true,
    type: "email",
  },
}

export const WithHint: Story = {
  args: {
    label: "Preço",
    placeholder: "0,00",
    hint: "Informe o valor em reais (R$)",
    type: "number",
  },
}

export const WithError: Story = {
  args: {
    label: "Nome do produto",
    placeholder: "Ex: Pizza Margherita",
    error: "O nome do produto é obrigatório",
    required: true,
  },
}

export const Disabled: Story = {
  args: {
    label: "ID do pedido",
    value: "ORD-2026-001",
    disabled: true,
  },
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-[380px]">
      <InputField label="Nome do produto" placeholder="Ex: Pizza Margherita" required />
      <InputField
        label="Preço"
        placeholder="0,00"
        hint="Informe o valor em reais (R$)"
        type="number"
      />
      <InputField
        label="Categoria"
        placeholder="Ex: Pizza, Burger, Sobremesa"
        error="Selecione uma categoria válida"
      />
    </div>
  ),
}
