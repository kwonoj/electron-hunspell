//tslint:disable:no-require-imports
import { expect } from 'chai';
import loggerType = require('../../src/util/logger');

describe('logger', () => {
  let log: typeof loggerType.log;
  let enableLogger: typeof loggerType.enableLogger;

  beforeEach(() => ({ log, enableLogger } = require('../../src/util/logger')));

  it('should do nothing by default', () => {
    Object.keys(log).forEach(logLevel => expect(() => log[logLevel]('')).to.not.throw());
  });

  it('should accept log function', () => {
    const mock = jest.fn();
    enableLogger(mock);

    const message = 'message';
    const value = { value: 'value' };

    Object.keys(log).forEach(logLevel => log[logLevel](message, value));

    expect(mock.mock.calls).to.have.lengthOf(4);
    expect(mock.mock.calls).to.deep.equal([[message, value], [message, value], [message, value], [message, value]]);
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
      expect(mockLogger[logLevel].mock.calls).to.have.lengthOf(1);
      expect(mockLogger[logLevel].mock.calls[0]).to.deep.equal([message, value]);
    });
  });
});
