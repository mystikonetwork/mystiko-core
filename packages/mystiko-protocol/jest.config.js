/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/types/*.d.ts', '!src/witness_calculator.js'],
  coverageThreshold: {
    global: {
      lines: 95,
      branches: 90,
      statements: 95,
      functions: 95,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
