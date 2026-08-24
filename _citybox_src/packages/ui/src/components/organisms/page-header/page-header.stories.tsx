import type { Meta, StoryObj } from "@storybook/react"
import { PageHeader } from "./page-header"
import { Button } from "../../atoms/button"
import { Plus, Download } from "lucide-react"

const meta: Meta<typeof PageHeader> = {
  title: "Organisms/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl bg-background p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    title: "Cardápio",
    description: "Gerencie os itens do cardápio do seu estabelecimento",
  },
}

export const WithActions: Story = {
  args: {
    title: "Cardápio",
    description: "Gerencie os itens do cardápio do seu estabelecimento",
    actions: (
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo item
        </Button>
      </div>
    ),
  },
}

export const WithBreadcrumbs: Story = {
  args: {
    title: "Cardápio",
    description: "Gerencie os itens do cardápio",
    breadcrumbs: [
      { label: "Dashboard", href: "#" },
      { label: "Comércio", href: "#" },
      { label: "Cardápio" },
    ],
    actions: (
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Novo item
      </Button>
    ),
  },
}

export const TitleOnly: Story = {
  args: {
    title: "Configurações",
  },
}
