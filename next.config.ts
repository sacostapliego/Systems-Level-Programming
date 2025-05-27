import type { NextConfig } from 'next';

const REPO_NAME = 'Systems-Level-Programming'; 

const nextConfig: NextConfig = {
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