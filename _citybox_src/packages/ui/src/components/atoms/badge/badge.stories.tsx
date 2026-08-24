import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Ativo</Badge>
      <Badge variant="secondary">Pendente</Badge>
      <Badge variant="destructive">Cancelado</Badge>
      <Badge variant="outline">Pizza</Badge>
      <Badge variant="outline">Burger</Badge>
      <Badge variant="outline">Sobremesa</Badge>
    </div>
  ),
}
