import type { StorybookConfig } from "@storybook/react-vite"
import { join, dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = dirname(fileURLToPath(import.meta.url))

const require = createRequire(import.meta.url)

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")))
}

const config: StorybookConfig = {
  stories: [
    "../src/components/atoms/**/*.stories.@(ts|tsx|mdx)",
    "../src/components/molecules/**/*.stories.@(ts|tsx|mdx)",
    "../src/components/organisms/**/*.stories.@(ts|tsx|mdx)",
    "../src/components/templates/**/*.stories.@(ts|tsx|mdx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  async viteFinal(config) {
    const { default: tailwindcss } = await import("@tailwindcss/vite")

    config.esbuild = {
      ...config.esbuild,
      jsx: "automatic",
      jsxImportSource: "react",
    }

    config.plugins = [...(config.plugins ?? []), tailwindcss()]

    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string> ?? {}),
        "@": resolve(__dirname, "../src"),
      },
    }

    return config
  },
}

export default config
