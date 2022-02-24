/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 95,
      branches: 90,
      statements: 95,
      functions: 95,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/tests'],
};
