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
 * @param {logFunctionType | logObjectType} logger Logger object contains loglevel function (debug, info, warn, error)
 * or single function to log. If single function is provided, all loglevel will use given function.
 * If logger object is provided, it should have all loglevel function.
 */
function enableLogger(logger: logFunctionType): void;
function enableLogger(logger: Partial<logObjectType>): void;
function enableLogger(logger: logFunctionType | Partial<logObjectType>) {
  const isLogFunction = typeof logger === 'function';
  Object.keys(log).forEach(
    key =>
      (log[key] = isLogFunction
        ? logger
        : logger[key] ||
          (() => {
            /*noop*/
          }))
  );

  setHunspellLogger(log.debug.bind(log));
}

export { logFunctionType, logObjectType, enableLogger, log };
