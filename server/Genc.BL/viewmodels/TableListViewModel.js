/**
 * TableListViewModel - Standardized Paged Tabular Data ViewModel.
 * Wraps list query items with pagination metadata for frontend grid/table components.
 */
class TableListViewModel {
  /**
   * Format paginated list result for API response.
   * @param {Array<any>} items 
   * @param {number} totalCount 
   * @param {number} page 
   * @param {number} limit 
   * @returns {object}
   */
  static toPagedResult(items = [], totalCount = 0, page = 1, limit = 10) {
    const validLimit = Math.max(1, parseInt(limit, 10) || 10);
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const totalPages = Math.ceil(totalCount / validLimit) || 1;

    return {
      items,
      pagination: {
        totalCount,
        page: validPage,
        limit: validLimit,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
    };
  }
}

module.exports = TableListViewModel;
