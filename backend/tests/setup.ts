// Jest setup file
// Увеличить таймаут для всех тестов
jest.setTimeout(30000);

// Подавить логи во время тестов
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

