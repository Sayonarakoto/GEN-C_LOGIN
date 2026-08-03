const BaseService = require('../../core-genc/base.service');
const DepartmentAccessView = require('../../Genc.DAL/models/DepartmentAccessView');
const logger = require('../../utils/logger');

class DepartmentAccessService extends BaseService {
  constructor() {
    super(DepartmentAccessView, 'DepartmentAccessService');
  }

  /**
   * Query records from MongoDB Native View filtered by department scope.
   * @param {string} department 
   * @param {object} options 
   * @returns {Promise<object>}
   */
  async getDepartmentSubmissions(department, options = {}) {
    const startTime = Date.now();
    logger.logMethodCall('DepartmentAccessService', 'getDepartmentSubmissions', { department, options });

    try {
      const filter = { department: (department || '').toUpperCase() };
      const result = await this.list(filter, options);

      logger.logMethodSuccess('DepartmentAccessService', 'getDepartmentSubmissions', Date.now() - startTime);
      return result;
    } catch (error) {
      logger.logMethodError('DepartmentAccessService', 'getDepartmentSubmissions', error, Date.now() - startTime);
      return { success: false, message: error.message, data: [], totalCount: 0 };
    }
  }
}

module.exports = new DepartmentAccessService();
