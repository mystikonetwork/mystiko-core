import rootLogger from 'loglevel';
import logPrefixer, { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';

/**
 * @module module:mystiko/logger
 * @desc a logger module for logging relevant information.
 */
/**
 * @property {Object} module:mystiko/logger.defaultLoggingOptions
 * @desc default logging options
 */
export const defaultLoggingOptions: LoglevelPluginPrefixOptions = {
  template: '[%t] %l %n:',
  levelFormatter(level: string): string {
    return level.toUpperCase();
  },
  nameFormatter(name?: string): string {
    return name || 'root';
  },
  timestampFormatter(date: Date): string {
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
  },
  format: undefined,
};

/**
 * @function module:mystiko/logger.initLogger
 * @param {Object} [loggingOptions]
 * @desc initialize logger with given logging options.
 */
export function initLogger(loggingOptions?: LoglevelPluginPrefixOptions) {
  logPrefixer.reg(rootLogger);
  logPrefixer.apply(rootLogger, loggingOptions || defaultLoggingOptions);
}

export const logger = rootLogger;
