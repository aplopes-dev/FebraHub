import type { Preview } from "@storybook/react"
import "./preview.css"

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f172a" },
        { name: "muted", value: "#f8fafc" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  tags: ["autodocs"],
}

export default preview
