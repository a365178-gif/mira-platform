import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(appDirectory, '../..');
const webExtensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@mira/design-tokens', '@mira/ui'],
  webpack(config) {
    config.resolve.extensions = [...webExtensions, ...config.resolve.extensions];
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': 'react-native-web',
    };
    return config;
  },
};

export default nextConfig;
