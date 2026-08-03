const BaseController = require('../../core-genc/base.controller');
const navigationService = require('../services/navigationService');
const logger = require('../../utils/logger');


class NavigationController extends BaseController {
  constructor() {
    super(navigationService, null, 'NavigationController');
    this.getUserNavigation = this.getUserNavigation.bind(this);
  }

  async getUserNavigation(req, res) {
    const startTime = Date.now();
    const activeRole = req.user?.activeRole || req.user?.role || 'student';
    logger.logMethodCall('NavigationController', 'getUserNavigation', { activeRole });

    try {
      const result = await navigationService.getNavigationForRole(activeRole);
      if (!result.success) {
        return res.status(result.statusCode || 400).json({ success: false, message: result.message });
      }

      logger.logMethodSuccess('NavigationController', 'getUserNavigation', Date.now() - startTime);
      return res.status(200).json(result);
    } catch (error) {
      logger.logMethodError('NavigationController', 'getUserNavigation', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error retrieving navigation.' });
    }
  }
}

module.exports = new NavigationController();
