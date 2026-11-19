import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.web.tsx', '.native.tsx', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      'react-native': 'react-native-web',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
