import path from 'node:path';
import { defineConfig } from 'vitest/config';

const uiRoot = path.resolve(__dirname, '../../../../packages/ui/src');

export default defineConfig({
  resolve: {
    alias: [
      { find: '@citybox/ui/organisms', replacement: path.join(uiRoot, 'components/organisms/index.ts') },
      { find: '@citybox/ui/molecules', replacement: path.join(uiRoot, 'components/molecules/index.ts') },
      { find: '@citybox/ui/atoms', replacement: path.join(uiRoot, 'components/atoms/index.ts') },
      { find: '@citybox/ui', replacement: path.join(uiRoot, 'index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
