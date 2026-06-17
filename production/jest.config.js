/** @type {import('ts-jest').JestConfigWithTsJest} */

// 공통 설정 (node / jsdom 프로젝트가 함께 사용)
const common = {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '\\.next/'],
  // MSW v2 등 ESM-only 패키지를 ts-jest 가 트랜스폼하도록
  // node_modules 무시 패턴에서 제외한다.
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs|@open-draft|@bundled-es-modules|rettime|until-async|strict-event-emitter|outvariant|headers-polyfill|tough-cookie|graphql|is-node-process)/)',
  ],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          allowJs: true,
          isolatedModules: true,
        },
        diagnostics: false,
      },
    ],
    '^.+\\.mjs$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          allowJs: true,
          isolatedModules: true,
        },
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],
};

module.exports = {
  // 커버리지는 루트에서 수집
  collectCoverageFrom: ['src/lib/recommender/**/*.ts', 'src/app/api/**/*.ts'],
  projects: [
    // ── (1) node 환경: API 라우트 + 순수 로직 (MSW 모킹 사용) ──
    {
      ...common,
      displayName: 'node',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      // jsdom 전용 테스트(@jest-environment jsdom 사용)는 jsdom 프로젝트가 담당
      testMatch: ['**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/', '\\.next/', 'trackingStore\\.test\\.ts'],
    },
    // ── (2) jsdom 환경: 브라우저 의존 로직 (localStorage 등, MSW 불필요) ──
    {
      ...common,
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.jsdom.ts'],
      testMatch: ['**/__tests__/**/trackingStore.test.ts'],
    },
  ],
};
