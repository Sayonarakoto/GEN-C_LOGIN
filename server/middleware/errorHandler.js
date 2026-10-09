const logger = require('../utils/logger');
const { toClientError } = require('../utils/clientError');

// Maps any thrown error to { success:false, message, code[, details] }.
// Internal exception text is logged, never returned.
const errorHandler = (err, req, res, next) => {
    const { statusCode, message, code, details } = toClientError(err);

    if (statusCode >= 500) {
        logger.error(`[${statusCode}] ${req.method} ${req.originalUrl} -> ${message} :: ${err && (err.stack || err.message)}`);
    } else {
        logger.warn(`[${statusCode}] ${req.method} ${req.originalUrl} -> ${code}: ${message}`);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(details !== undefined ? { details } : {}),
    });
};

const notFoundHandler = (req, res) => {
    logger.warn(`[404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'That request could not be found.',
        code: 'NOT_FOUND',
    });
};

module.exports = { errorHandler, notFoundHandler };
