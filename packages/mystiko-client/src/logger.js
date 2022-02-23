import logger from 'loglevel';
import logPrefixer from 'loglevel-plugin-prefix';
import { check } from '@mystiko/utils';

/**
 * @module module:mystiko/logger
 * @desc a logger module for logging relevant information.
 */
/**
 * @property {Object} module:mystiko/logger.defaultLoggingOptions
 * @desc default logging options
 */
export const defaultLoggingOptions = {
  template: '[%t] %l %n:',
  levelFormatter: function (level) {
    return level.toUpperCase();
  },
  nameFormatter: function (name) {
    return name || 'root';
  },
  timestampFormatter: function (date) {
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
  },
  format: undefined,
};

/**
 * @function module:mystiko/logger.initLogger
 * @param {Object} [loggingOptions]
 * @desc initialize logger with given logging options.
 */
export function initLogger(loggingOptions = undefined) {
  check(!loggingOptions || loggingOptions instanceof Object, 'invalid loggingOptions');
  logPrefixer.reg(logger);
  logPrefixer.apply(logger, loggingOptions ? loggingOptions : defaultLoggingOptions);
}

export default logger;
