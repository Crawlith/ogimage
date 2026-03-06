/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [],
    serverExternalPackages: [
        'yoga-wasm-web',
        '@resvg/resvg-js',
        '@resvg/resvg-wasm',
        'satori',
        '@og-engine/core',
        '@og-engine/types',
        '@og-engine/sandbox'
    ],
    turbopack: {
        root: '../../'
    }
};

export default nextConfig;
