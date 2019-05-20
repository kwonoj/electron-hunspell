import { enableLogger as hunspellEnableLogger } from 'hunspell-asm';
import { enableLogger, log } from '../../src/util/logger';

jest.mock('hunspell-asm');

describe('logger', () => {
  it('should do nothing by default', () => {
    Object.keys(log).forEach(logLevel => expect(() => log[logLevel]('')).not.toThrow());
  });

  it('should accept log function', () => {
    const mockLogFn = jest.fn();
    enableLogger(mockLogFn);

    const message = 'message';
    const value = { value: 'value' };

    Object.keys(log).forEach(logLevel => log[logLevel](message, value));

    const mockCalls = mockLogFn.mock.calls;

    expect(mockCalls).toHaveLength(4);
    expect(mockCalls).toEqual([[message, value], [message, value], [message, value], [message, value]]);
  });

  it('should accept log object', () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    enableLogger(mockLogger);

    const message = 'message';
    const value = { value: 'value' };

    Object.keys(log).forEach(logLevel => log[logLevel](message, value));

    Object.keys(mockLogger).forEach(logLevel => {
      const mockCalls = mockLogger[logLevel].mock.calls;
      expect(mockCalls).toHaveLength(1);
      expect(mockCalls[0]).toEqual([message, value]);
    });
  });

  it('should accept partial log object', () => {
    const mockLogger = {
      info: jest.fn()
    };

    enableLogger(mockLogger);

    const message = 'message';
    const value = { value: 'value' };

    log.info(message, value);
    expect(() => log.debug('boo')).not.toThrow();
    expect(mockLogger.info.mock.calls).toHaveLength(1);
    expect(mockLogger.info.mock.calls[0]).toEqual([message, value]);
  });

  it('should set function to hunspell logger', () => {
    jest.resetAllMocks();

    const mockLogFn = jest.fn();
    enableLogger(mockLogFn);

    expect((hunspellEnableLogger as any).mock.calls).toHaveLength(1);
  });

  it('should set debug fn from object to hunspell logger', () => {
    jest.resetAllMocks();

    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    enableLogger(mockLogger);

    expect((hunspellEnableLogger as any).mock.calls).toHaveLength(1);
  });
});
