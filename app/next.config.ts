import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 인디케이터 비활성화
  devIndicators: false,
  // Amplify Lambda 환경에서 이미지 최적화 비활성화
  images: {
    unoptimized: true,
  },
  // 운영 환경에서 소스맵 비활성화 (보안 + 성능)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
