import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 인디케이터 비활성화
  devIndicators: false,
  // Amplify WEB_COMPUTE(SSR) 배포를 위한 standalone 출력 모드
  output: "standalone",
  // 운영 환경에서 소스맵 비활성화 (보안 + 성능)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
