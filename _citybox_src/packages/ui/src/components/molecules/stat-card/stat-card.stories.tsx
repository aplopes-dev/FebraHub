import type { Meta, StoryObj } from "@storybook/react"
import { StatCard } from "./stat-card"
import { ShoppingBag, Users, TrendingUp, Pizza } from "lucide-react"

const meta: Meta<typeof StatCard> = {
  title: "Molecules/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof StatCard>

export const Default: Story = {
  args: {
    title: "Total de pedidos",
    value: "1.284",
    trend: { value: 12, label: "este mês" },
    icon: <ShoppingBag className="h-5 w-5" />,
  },
}

export const PositiveTrend: Story = {
  args: {
    title: "Receita mensal",
    value: "R$ 42.800",
    trend: { value: 18, label: "vs. mês anterior" },
    icon: <TrendingUp className="h-5 w-5" />,
  },
}

export const NegativeTrend: Story = {
  args: {
    title: "Cancelamentos",
    value: "23",
    trend: { value: -5, label: "esta semana" },
    icon: <ShoppingBag className="h-5 w-5" />,
  },
}

export const NeutralTrend: Story = {
  args: {
    title: "Itens no cardápio",
    value: "47",
    trend: { value: 0, label: "sem mudança" },
    icon: <Pizza className="h-5 w-5" />,
  },
}

export const WithoutTrend: Story = {
  args: {
    title: "Clientes ativos",
    value: "3.421",
    icon: <Users className="h-5 w-5" />,
  },
}

export const DashboardGrid: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
      <StatCard
        title="Total de pedidos"
        value="1.284"
        trend={{ value: 12, label: "este mês" }}
        icon={<ShoppingBag className="h-5 w-5" />}
      />
      <StatCard
        title="Receita"
        value="R$ 42.800"
        trend={{ value: 18, label: "vs. anterior" }}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatCard
        title="Clientes"
        value="3.421"
        trend={{ value: 0, label: "sem mudança" }}
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  ),
}
