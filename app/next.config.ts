// original source
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   devIndicators: false,
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'export', // 👈 이 줄이 'out' 폴더를 만드는 핵심입니다!
  images: {
    unoptimized: true, // 👈 정적 배포(Export) 시 필수 설정입니다.
  },
};

export default nextConfig;