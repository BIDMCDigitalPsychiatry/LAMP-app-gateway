// Global test setup file
import 'reflect-metadata';

// Mock Sentry for tests
jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

// Extend Jest matchers for better testing
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

// Extend global namespace for test utilities
declare global {
  var testUtils: {
    mockConfigService: (config?: any) => any;
  };
}

// Global test utilities
(global as any).testUtils = {
  mockConfigService: (config: any = {}) => ({
    get: jest.fn().mockImplementation((key: string) => {
      return config[key] || config;
    }),
  }),
};

// Suppress console logs during tests unless explicitly needed
const originalConsole = { ...console };

beforeAll(() => {
  if (process.env.NODE_ENV !== 'test-verbose') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  if (process.env.NODE_ENV !== 'test-verbose') {
    Object.assign(console, originalConsole);
  }
});