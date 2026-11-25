/**
 * @file DataTable.jsx
 * @description Reusable, declarative data table with sorting, pagination, empty, and loading states.
 */

import React, { useState, useMemo, useCallback } from 'react';
import styles from './DataTable.module.css';

/**
 * Resolves nested object property path (e.g. 'faculty.fullName').
 * @param {Object} obj - Target object.
 * @param {string|Function} accessor - Property path or extractor function.
 * @returns {*} Extracted value.
 */
function resolveValue(obj, accessor) {
  if (!obj) return '';
  if (typeof accessor === 'function') return accessor(obj);
  if (typeof accessor !== 'string') return '';
  if (!accessor.includes('.')) return obj[accessor];
  return accessor.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

/**
 * DataTable Component.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.columns - Column configuration array.
 * @param {Array<Object>} props.data - Array of table records.
 * @param {string} [props.keyField='_id'] - Unique record identifier field.
 * @param {boolean} [props.loading=false] - Whether data is actively loading.
 * @param {string} [props.emptyMessage='No records found.'] - Displayed when data is empty.
 * @param {Object} [props.initialSort] - Initial sorting state { key, direction: 'asc'|'desc' }.
 * @param {boolean} [props.pagination=true] - Whether client pagination is enabled.
 * @param {number} [props.defaultPageSize=10] - Default items per page.
 * @param {Array<number>} [props.pageSizeOptions=[5, 10, 25, 50]] - Configurable page sizes.
 * @param {Function} [props.onRowClick] - Row click handler.
 * @param {boolean} [props.hasFilterBar=false] - If attached directly beneath a FilterBar (styling aid).
 * @param {string} [props.className] - Custom container class.
 * @returns {JSX.Element} DataTable component.
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = '_id',
  loading = false,
  emptyMessage = 'No records found.',
  initialSort = { key: null, direction: null },
  pagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onRowClick,
  hasFilterBar = false,
  className = '',
}) {
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Sorting Handler
  const handleSort = useCallback(
    (col) => {
      if (!col.sortable) return;
      const key = col.sortKey || col.accessor;
      if (!key) return;

      setSortConfig((prev) => {
        if (prev.key === key) {
          if (prev.direction === 'asc') return { key, direction: 'desc' };
          if (prev.direction === 'desc') return { key: null, direction: null };
        }
        return { key, direction: 'asc' };
      });
    },
    []
  );

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    const { key, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const aVal = resolveValue(a, key);
      const bVal = resolveValue(b, key);

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * modifier;
      }

      // Date comparison
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);
      if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
        return (aDate - bDate) * modifier;
      }

      // String comparison
      return String(aVal).localeCompare(String(bVal)) * modifier;
    });
  }, [data, sortConfig]);

  // Paginated Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div
      className={`
        ${styles.tableContainer}
        ${hasFilterBar ? styles.hasFilterBar : ''}
        ${className}
      `}
    >
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const isSorted =
                  sortConfig.key === (col.sortKey || col.accessor) && Boolean(sortConfig.direction);
                const isAsc = sortConfig.direction === 'asc';

                return (
                  <th
                    key={idx}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className={`
                      ${styles.th}
                      ${col.sortable ? styles.thSortable : ''}
                    `}
                    onClick={() => handleSort(col)}
                  >
                    <div className={styles.thContent}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span
                          className={`
                            ${styles.sortIcon}
                            ${isSorted ? styles.sortIconActive : ''}
                          `}
                          aria-hidden="true"
                        >
                          {isSorted ? (
                            isAsc ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            )
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.stateContainer}>
                    <div className={styles.spinner} />
                    <p>Loading table records...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.stateContainer}>
                    <div className={styles.emptyIcon}>📋</div>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowKey = row[keyField] || rowIndex;

                return (
                  <tr
                    key={rowKey}
                    className={`
                      ${styles.tr}
                      ${onRowClick ? styles.trClickable : ''}
                    `}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((col, colIndex) => {
                      const rawValue = resolveValue(row, col.accessor);
                      const displayContent = col.render
                        ? col.render(rawValue, row, rowIndex)
                        : (rawValue !== undefined && rawValue !== null ? String(rawValue) : '—');

                      return (
                        <td
                          key={colIndex}
                          style={{ textAlign: col.align || 'left' }}
                          className={styles.td}
                        >
                          {displayContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && !loading && sortedData.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.pageSizeSelector}>
            <span>Show</span>
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Records per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              entries (Showing {startIndex} to {endIndex} of {sortedData.length})
            </span>
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              «
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>

            <span style={{ padding: '0 0.5rem', fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
