/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    },
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
