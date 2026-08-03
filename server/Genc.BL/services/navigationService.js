const BaseService = require('../../core-genc/base.service');
const RolePermission = require('../../Genc.DAL/models/RolePermission');
const AppDefinition = require('../../Genc.DAL/models/AppDefinition');
const AppMenu = require('../../Genc.DAL/models/AppMenu');
const logger = require('../../utils/logger');


class NavigationService extends BaseService {
  constructor() {
    super(RolePermission, 'NavigationService');
  }

  /**
   * Fetch allowed apps, menus, and granular permissions for a user's role.
   * @param {string} userRole 
   * @returns {Promise<object>}
   */
  async getNavigationForRole(userRole) {
    const startTime = Date.now();
    const roleKey = (userRole || 'student').toLowerCase();
    logger.logMethodCall('NavigationService', 'getNavigationForRole', { roleKey });

    try {
      const rolePerm = await this.model.findOne({ role: roleKey });

      const allowedAppCodes = rolePerm ? rolePerm.allowed_apps || [] : [];
      const allowedMenuCodes = rolePerm ? rolePerm.allowed_menus || [] : [];
      const permissions = rolePerm ? rolePerm.permissions || [] : [];

      const [apps, menus] = await Promise.all([
        AppDefinition.find({ app_code: { $in: allowedAppCodes }, is_active: true }),
        AppMenu.find({ menu_code: { $in: allowedMenuCodes } }).sort({ order_index: 1 }),
      ]);

      logger.logMethodSuccess('NavigationService', 'getNavigationForRole', Date.now() - startTime);
      return {
        success: true,
        data: {
          role: roleKey,
          apps,
          menus,
          permissions,
        },
      };
    } catch (error) {
      logger.logMethodError('NavigationService', 'getNavigationForRole', error, Date.now() - startTime);
      return { success: false, statusCode: 500, message: 'Server error retrieving navigation configuration.' };
    }
  }
}

module.exports = new NavigationService();
