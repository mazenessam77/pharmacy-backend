/** Minimal runner for pure frontend logic (no DOM). */
module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testMatch: ['**/src/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true, isolatedModules: true, skipLibCheck: true } }],
  },
};
