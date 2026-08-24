import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { Loader2, Mail, Trash2 } from "lucide-react"

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Variante visual do botão",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "Tamanho do botão",
    },
    disabled: {
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: "Botão padrão",
    variant: "default",
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-3 items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-3 items-center">
      <Button>
        <Mail className="h-4 w-4 mr-2" />
        Enviar email
      </Button>
      <Button variant="destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Excluir
      </Button>
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Carregando...
    </Button>
  ),
}

export const Disabled: Story = {
  args: {
    children: "Desabilitado",
    disabled: true,
  },
}
