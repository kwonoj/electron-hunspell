import { enableLogger as setHunspellLogger } from 'hunspell-asm';

type logFunctionType = (message: string, ...optionalParams: Array<any>) => void;
type logObjectType = {
  debug: logFunctionType;
  info: logFunctionType;
  warn: logFunctionType;
  error: logFunctionType;
};

/**
 * noop fn for default log behavior.
 */
const noopLog = (..._args: Array<any>) => {
  //noop
};

const log: Readonly<logObjectType> = {
  debug: noopLog,
  info: noopLog,
  warn: noopLog,
  error: noopLog
};

/**
 * Set logger for prints out internal behavior.
 * @param {logFunctionType | Partial<logObjectType>} logger Logger object contains loglevel function (debug, info, warn, error)
 * or single function to log.
 */
function enableLogger(logger: logFunctionType): void;
function enableLogger(logger: Partial<logObjectType>): void;
function enableLogger(logger: logFunctionType | Partial<logObjectType>) {
  const isLogFunction = typeof logger === 'function';

  //if logger is fn, assign to all loglevel. If logger is partial object, assign available logger or fall back to noop.
  Object.keys(log).forEach(key => (log[key] = isLogFunction ? logger : logger[key] || noopLog));

  setHunspellLogger(log.debug.bind(log));
}

export { logFunctionType, logObjectType, enableLogger, log };
