import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['knex']
  // webpack: (config, { isServer }) => {
  //   if (isServer) {
  //     const externals = [
  //       'oracledb',
  //       'pg-query-stream'
  //     ]
  //     config.externals.push(...externals); // 這裡以 sharp 為例
  //   }
  //   return config;
  // },
};

export default nextConfig;
