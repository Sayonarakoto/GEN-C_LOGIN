/**
 * High-Performance Method and Request Logger using Pino.
 * Provides structured JSON logging in production and pretty-printed logs in development,
 * along with method execution tracing and timing metrics.
 */
const pino = require('pino');
const pinoHttp = require('pino-http');

const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production';

const pinoOptions = isDev
  ? {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    }
  : {
      level: 'info',
      timestamp: pino.stdTimeFunctions.isoTime,
    };

const logger = pino(pinoOptions);

/**
 * Express HTTP request logging middleware using pino-http.
 */
const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

/**
 * Log method entry.
 * @param {string} className 
 * @param {string} methodName 
 * @param {object} [params] 
 */
logger.logMethodCall = function (className, methodName, params = {}) {
  try {
    logger.debug({ className, methodName, params }, `[ENTER METHOD] ${className}.${methodName}`);
  } catch (err) {
    logger.error({ err }, 'Error in logMethodCall');
  }
};

/**
 * Log method success and execution timing.
 * @param {string} className 
 * @param {string} methodName 
 * @param {number} durationMs 
 * @param {string} [msg] 
 */
logger.logMethodSuccess = function (className, methodName, durationMs = 0, msg = 'Executed successfully') {
  try {
    logger.info({ className, methodName, durationMs }, `[EXIT METHOD SUCCESS] ${className}.${methodName} (${durationMs}ms) - ${msg}`);
  } catch (err) {
    logger.error({ err }, 'Error in logMethodSuccess');
  }
};

/**
 * Log method error and execution timing.
 * @param {string} className 
 * @param {string} methodName 
 * @param {Error|object} error 
 * @param {number} durationMs 
 */
logger.logMethodError = function (className, methodName, error, durationMs = 0) {
  try {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    logger.error({ className, methodName, durationMs, error: errorDetails }, `[EXIT METHOD ERROR] ${className}.${methodName} (${durationMs}ms) - ${errorDetails.message || errorDetails}`);
  } catch (err) {
    logger.error({ err }, 'Error in logMethodError');
  }
};

module.exports = logger;
module.exports.httpLogger = httpLogger;
