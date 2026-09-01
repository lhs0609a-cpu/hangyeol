/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 워크스페이스 패키지를 TS 소스 그대로 가져다 쓴다.
  // 과금 로직을 별도 빌드 산출물로 복사하지 않아야 명세와 화면이 어긋나지 않는다.
  transpilePackages: ['@hangyeol/shared', '@hangyeol/billing', '@hangyeol/core', '@hangyeol/ui', '@hangyeol/content', '@hangyeol/watermark', '@hangyeol/langgate'],
  webpack: (config) => {
    // packages/* 는 ESM 규약대로 상대 임포트에 .js 확장자를 붙인다(`./invoice.js`).
    // 실제 파일은 .ts 이므로 webpack 에 매핑을 알려줘야 한다.
    // tsc 와 vitest 는 각자 알아서 처리하지만 webpack 은 그렇지 않다.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
