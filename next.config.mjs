/** @type {import('next').NextConfig} */

const REPO_NAME = 'Systems-Level-Programming';

const nextConfig = {
  output: 'export',
  basePath: `/${REPO_NAME}`,
  assetPrefix: `/${REPO_NAME}`,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: `/${REPO_NAME}`,
  },
};

export default nextConfig;