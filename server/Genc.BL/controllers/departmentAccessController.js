const BaseController = require('../../core-genc/base.controller');
const departmentAccessService = require('../services/departmentAccessService');
const TableListViewModel = require('../viewmodels/TableListViewModel');
const logger = require('../../utils/logger');

class DepartmentAccessController extends BaseController {
  constructor() {
    super(departmentAccessService, null, 'DepartmentAccessController');
    this.getDepartmentSubmissions = this.getDepartmentSubmissions.bind(this);
  }

  async getDepartmentSubmissions(req, res) {
    const startTime = Date.now();
    const userDept = req.user?.department;
    logger.logMethodCall('DepartmentAccessController', 'getDepartmentSubmissions', { userDept });

    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const result = await departmentAccessService.getDepartmentSubmissions(userDept, { limit, skip });
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }

      const pagedResult = TableListViewModel.toPagedResult(result.data, result.totalCount, page, limit);

      logger.logMethodSuccess('DepartmentAccessController', 'getDepartmentSubmissions', Date.now() - startTime);
      return res.status(200).json({ success: true, data: pagedResult });
    } catch (error) {
      logger.logMethodError('DepartmentAccessController', 'getDepartmentSubmissions', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error retrieving department access records.' });
    }
  }
}

module.exports = new DepartmentAccessController();
