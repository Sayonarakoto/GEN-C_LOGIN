/**
 * Turns any thrown error into a response the UI can safely show.
 * Raw exception text (mongoose, jwt, multer, TypeErrors...) never reaches the client.
 */

const GENERIC_SERVER_ERROR = Object.freeze({
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
    code: 'SERVER_ERROR',
});

const STATUS_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    413: 'FILE_TOO_LARGE',
    415: 'UNSUPPORTED_TYPE',
    429: 'RATE_LIMITED',
};

const JWT_ERRORS = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
const DB_ERRORS = [
    'MongooseServerSelectionError',
    'MongoServerSelectionError',
    'MongoNetworkError',
    'MongoNotConnectedError',
    'MongoTimeoutError',
];

function codeForStatus(status) {
    return STATUS_CODES[status] || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_REJECTED');
}

function validationDetails(err) {
    if (!err.errors || typeof err.errors !== 'object') return undefined;
    const details = Object.values(err.errors)
        .slice(0, 5)
        .map((field) => ({ field: field.path, message: field.message }));
    return details.length ? details : undefined;
}

function toClientError(err) {
    if (!err || typeof err !== 'object') return { ...GENERIC_SERVER_ERROR };

    const status = Number(err.statusCode || err.status);

    // File uploads (multer) - checked first: these carry their own status codes
    if (err.code === 'LIMIT_FILE_SIZE') {
        return { statusCode: 400, message: 'File too large. Max file size is 10MB.', code: 'FILE_TOO_LARGE' };
    }
    if (typeof err.code === 'string' && err.code.startsWith('LIMIT_')) {
        return {
            statusCode: 400,
            message: "That file couldn't be uploaded. Please try a different image.",
            code: 'FILE_INVALID',
        };
    }

    // Malformed JSON body (express.json / urlencoded parser)
    if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
        return { statusCode: 400, message: 'The request could not be read. Please try again.', code: 'BAD_JSON' };
    }

    // Errors we raised on purpose (createError / services): already written for humans
    if (Number.isInteger(status) && status >= 400 && status < 500) {
        return {
            statusCode: status,
            message: err.message && String(err.message).trim() ? String(err.message) : 'Please check your request and try again.',
            code: err.code || codeForStatus(status),
            ...(err.details !== undefined ? { details: err.details } : {}),
        };
    }

    // Mongoose field validation
    if (err.name === 'ValidationError' && err.errors) {
        return {
            statusCode: 400,
            message: 'Please check the details you entered.',
            code: 'VALIDATION_ERROR',
            details: validationDetails(err),
        };
    }

    // Bad ObjectId / date cast
    if (err.name === 'CastError') {
        return {
            statusCode: 400,
            message: "Some of the information sent wasn't in the expected format.",
            code: 'INVALID_FORMAT',
        };
    }

    // Duplicate key
    if (err.code === 11000 || (typeof err.code === 'string' && err.code.startsWith('E11000'))) {
        return {
            statusCode: 409,
            message: 'That value is already in use. Please choose a different one.',
            code: 'DUPLICATE',
        };
    }

    // Bad/expired token
    if (JWT_ERRORS.includes(err.name) || /\bjwt\b/i.test(String(err.message || ''))) {
        return { statusCode: 401, message: 'Your session has expired. Please log in again.', code: 'SESSION_INVALID' };
    }

    // Database unreachable / timed out
    if (DB_ERRORS.includes(err.name) || err.name === 'MongooseError') {
        return {
            statusCode: 503,
            message: "We're having trouble reaching the database. Please try again in a moment.",
            code: 'DB_UNAVAILABLE',
        };
    }

    // Anything else (including explicit 5xx): never expose internals
    return { ...GENERIC_SERVER_ERROR };
}

module.exports = { toClientError, codeForStatus };
