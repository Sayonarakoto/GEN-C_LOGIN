/**
 * @file FilterBar.jsx
 * @description Standard reusable filter bar for data reports and grids.
 */

import React from 'react';
import styles from './DataTable.module.css';

/**
 * FilterBar Component.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.searchValue=''] - Controlled search query text.
 * @param {Function} [props.onSearchChange] - Search input change handler.
 * @param {string} [props.searchPlaceholder='Search records...'] - Search input placeholder.
 * @param {Array<Object>} [props.filters=[]] - Additional filter dropdown configs [{ key, label, value, options, onChange }].
 * @param {Function} [props.onClear] - Clear filters handler.
 * @param {React.ReactNode} [props.actions] - Additional custom buttons/elements on the right side.
 * @param {string} [props.className] - Additional CSS class.
 * @returns {JSX.Element} FilterBar component.
 */
export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onClear,
  actions,
  className = '',
}) {
  const hasActiveFilters = Boolean(
    searchValue.trim() ||
      filters.some((f) => f.value && f.value !== 'all' && f.value !== '')
  );

  return (
    <div className={`${styles.filterBar} ${className}`}>
      <div className={styles.filterControls}>
        {/* Search Input */}
        {onSearchChange && (
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search records"
            />
          </div>
        )}

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <select
            key={filter.key}
            className={styles.filterSelect}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            aria-label={filter.label || filter.key}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Clear Filters Button */}
        {hasActiveFilters && onClear && (
          <button
            type="button"
            className={styles.clearFilterBtn}
            onClick={onClear}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Right-aligned custom actions */}
      {actions && <div className={styles.filterActions}>{actions}</div>}
    </div>
  );
}

export default FilterBar;
