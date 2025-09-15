import type { Config } from 'jest';

const config: Config = {
  rootDir: './',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleDirectories: ['node_modules', 'src'],
  modulePaths: ['<rootDir>'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/**/*.module.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};

export default config;
