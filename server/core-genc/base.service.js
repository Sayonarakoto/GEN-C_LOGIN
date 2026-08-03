const { getMongoose } = require('./db');
const logger = require('../utils/logger');

/**
 * Enterprise BaseService
 * Encapsulates Mongoose CRUD operations, schema validation, transactional safety with fallback,
 * method tracing, and standardized result structures.
 */
class BaseService {
  constructor(model, name = 'BaseService') {
    this.model = model;
    this.name = name;
    this.mongoose = getMongoose();
  }

  /**
   * Base payload validation helper using Mongoose schema validation.
   * @param {object} payload 
   * @returns {Promise<{ isValid: boolean, errors?: string[] }>}
   */
  async validate(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        return { isValid: false, errors: ['Payload must be a non-empty object'] };
      }
      const doc = new this.model(payload);
      const err = doc.validateSync();
      if (err) {
        const errorMessages = Object.values(err.errors).map((e) => e.message);
        return { isValid: false, errors: errorMessages };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, errors: [error.message] };
    }
  }

  /**
   * Safely execute work inside a transaction, falling back if standalone MongoDB does not support transactions.
   * @param {Function} workFn 
   * @returns {Promise<object>}
   */
  async executeInTransaction(workFn) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'executeInTransaction');
    let session = null;

    try {
      session = await this.mongoose.startSession();
      session.startTransaction();

      const result = await workFn(session);
      await session.commitTransaction();
      session.endSession();

      logger.logMethodSuccess(this.name, 'executeInTransaction', Date.now() - startTime);
      return { success: true, data: result, message: 'Operation successful' };
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
          session.endSession();
        } catch (sErr) {
          // Ignore session cleanup errors
        }
      }

      // Fallback for standalone MongoDB deployments without replica set transaction support
      if (error.message && (error.message.includes('Transaction numbers are only allowed') || error.message.includes('standalone'))) {
        try {
          logger.warn(`[${this.name}] Standalone MongoDB detected. Executing without transaction session.`);
          const fallbackResult = await workFn(null);
          logger.logMethodSuccess(this.name, 'executeInTransaction (fallback)', Date.now() - startTime);
          return { success: true, data: fallbackResult, message: 'Operation successful' };
        } catch (fbError) {
          logger.logMethodError(this.name, 'executeInTransaction (fallback)', fbError, Date.now() - startTime);
          return { success: false, data: null, message: fbError.message };
        }
      }

      logger.logMethodError(this.name, 'executeInTransaction', error, Date.now() - startTime);
      return { success: false, data: null, message: error.message };
    }
  }

  async getById(id) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'getById', { id });
    try {
      if (!this.mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, statusCode: 400, message: 'Invalid ID format' };
      }
      const data = await this.model.findById(id);
      logger.logMethodSuccess(this.name, 'getById', Date.now() - startTime);
      return { success: true, data };
    } catch (error) {
      logger.logMethodError(this.name, 'getById', error, Date.now() - startTime);
      return { success: false, statusCode: 500, message: error.message };
    }
  }

  async list(filter = {}, options = {}) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'list', { filter, options });
    try {
      const limit = parseInt(options.limit, 10) || 0;
      const skip = parseInt(options.skip, 10) || 0;
      const sort = options.sort || { created_at: -1 };

      const query = this.model.find(filter).sort(sort);
      if (skip > 0) query.skip(skip);
      if (limit > 0) query.limit(limit);

      const [data, totalCount] = await Promise.all([
        query.exec(),
        this.model.countDocuments(filter),
      ]);

      logger.logMethodSuccess(this.name, 'list', Date.now() - startTime);
      return { success: true, data, totalCount };
    } catch (error) {
      logger.logMethodError(this.name, 'list', error, Date.now() - startTime);
      return { success: false, message: error.message, data: [], totalCount: 0 };
    }
  }

  async save(payload) {
    const valRes = await this.validate(payload);
    if (!valRes.isValid) {
      return { success: false, statusCode: 400, message: 'Validation failed', errors: valRes.errors };
    }
    return this.executeInTransaction(async (s) => {
      const doc = new this.model(payload);
      return await doc.save({ session: s });
    });
  }

  async update(id, payload) {
    if (!this.mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, statusCode: 400, message: 'Invalid ID format' };
    }
    return this.executeInTransaction(async (s) => {
      const updated = await this.model.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
        session: s,
      });
      return updated;
    });
  }

  async remove(id) {
    if (!this.mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, statusCode: 400, message: 'Invalid ID format' };
    }
    return this.executeInTransaction(async (s) => {
      return await this.model.findByIdAndDelete(id, { session: s });
    });
  }
}

module.exports = BaseService;
