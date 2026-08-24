import type { Meta, StoryObj } from "@storybook/react"
import { EmptyState } from "./empty-state"
import { Button } from "../../atoms/button"
import { Pizza, Search, FileX, ShoppingBag } from "lucide-react"

const meta: Meta<typeof EmptyState> = {
  title: "Organisms/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md border rounded-lg bg-background">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    icon: <Pizza className="h-8 w-8" />,
    title: "Nenhum item no cardápio",
    description: "Adicione o primeiro item para começar a receber pedidos.",
    action: <Button>Adicionar item</Button>,
  },
}

export const SearchEmpty: Story = {
  args: {
    icon: <Search className="h-8 w-8" />,
    title: "Nenhum resultado encontrado",
    description: 'Sua busca por "X-Burguer especial" não retornou resultados.',
    action: <Button variant="outline">Limpar busca</Button>,
  },
}

export const NoOrders: Story = {
  args: {
    icon: <ShoppingBag className="h-8 w-8" />,
    title: "Sem pedidos ainda",
    description: "Os pedidos aparecerão aqui assim que forem realizados.",
  },
}

export const ErrorState: Story = {
  args: {
    icon: <FileX className="h-8 w-8" />,
    title: "Erro ao carregar dados",
    description: "Não foi possível buscar os dados. Tente novamente.",
    action: (
      <Button variant="outline">
        Tentar novamente
      </Button>
    ),
  },
}
