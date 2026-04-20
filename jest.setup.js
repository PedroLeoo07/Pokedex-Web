// jest.setup.js
// Configuração global para testes

// Mock de process.env.NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Suppress console logs durante testes (opcional)
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Se precisar de logs durante debug, comente as linhas acima
