/**
 * @file MultiSelectDropdown.jsx
 * @description Accessible multi-select dropdown featuring tag chips, search filtering, and bulk actions.
 */

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import styles from './MultiSelectDropdown.module.css';

/**
 * MultiSelectDropdown Component.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.id] - Element ID.
 * @param {string} [props.name] - Form field name identifier.
 * @param {string} [props.label] - Field label text.
 * @param {Array<Object|string|number>} [props.options=[]] - List of selectable options.
 * @param {Array<*>} [props.value=[]] - Currently selected values array.
 * @param {Function} [props.onChange] - Callback invoked when selection changes.
 * @param {Function} [props.onBlur] - Callback invoked when focus leaves the component.
 * @param {string} [props.placeholder='Select options...'] - Placeholder text.
 * @param {boolean} [props.required=false] - Whether selection is required.
 * @param {boolean} [props.disabled=false] - Disabled state.
 * @param {boolean} [props.searchable=true] - Whether to show search filter input.
 * @param {string} [props.searchPlaceholder='Search options...'] - Placeholder for search input.
 * @param {boolean} [props.showActions=true] - Whether to show Select All / Clear All buttons.
 * @param {boolean} [props.loading=false] - Whether options are currently loading.
 * @param {string} [props.emptyMessage='No options found'] - Message when no options match filter.
 * @param {string} [props.valueKey='value'] - Property name for option value.
 * @param {string} [props.labelKey='label'] - Property name for option label.
 * @param {string} [props.error] - Validation error message.
 * @param {boolean} [props.isInvalid=false] - Explicit invalid flag.
 * @param {string} [props.helperText] - Supporting helper text.
 * @param {string} [props.className] - Custom wrapper class.
 * @returns {JSX.Element} MultiSelectDropdown component.
 */
export function MultiSelectDropdown({
  id: customId,
  name,
  label,
  options = [],
  value = [],
  onChange,
  onBlur,
  placeholder = 'Select options...',
  required = false,
  disabled = false,
  searchable = true,
  searchPlaceholder = 'Search options...',
  showActions = true,
  loading = false,
  emptyMessage = 'No options found',
  valueKey = 'value',
  labelKey = 'label',
  error,
  isInvalid = false,
  helperText,
  className = '',
}) {
  const generatedId = useId();
  const dropdownId = customId || `multiselect-${name || generatedId}`;
  const listboxId = `${dropdownId}-listbox`;
  const errorId = `${dropdownId}-error`;
  const helperId = `${dropdownId}-helper`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize selected values as an array
  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
  }, [value]);

  // Normalize options into { value, label, raw }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt[valueKey] !== undefined ? opt[valueKey] : opt.id || '',
          label: opt[labelKey] !== undefined ? opt[labelKey] : opt.name || opt.title || String(opt[valueKey]),
          raw: opt,
        };
      }
      return {
        value: opt,
        label: String(opt),
        raw: opt,
      };
    });
  }, [options, valueKey, labelKey]);

  // Selected option objects for chip display
  const selectedOptionObjects = useMemo(() => {
    return normalizedOptions.filter((opt) => selectedValues.includes(String(opt.value)));
  }, [normalizedOptions, selectedValues]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [normalizedOptions, searchTerm]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (isOpen) {
          setIsOpen(false);
          setSearchTerm('');
          if (onBlur) {
            onBlur({ target: { name, value: selectedValues } });
          }
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, name, onBlur, selectedValues]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchTerm('');
  };

  const handleToggleOption = useCallback(
    (option) => {
      const optValStr = String(option.value);
      const exists = selectedValues.includes(optValStr);
      let updatedValues;

      if (exists) {
        updatedValues = selectedValues.filter((v) => v !== optValStr);
      } else {
        updatedValues = [...selectedValues, option.value];
      }

      if (onChange) {
        onChange({
          target: {
            name,
            value: updatedValues,
          },
        });
      }
    },
    [name, onChange, selectedValues]
  );

  const handleRemoveChip = (e, valToRemove) => {
    e.stopPropagation();
    if (disabled) return;
    const updatedValues = selectedValues.filter((v) => v !== String(valToRemove));
    if (onChange) {
      onChange({
        target: {
          name,
          value: updatedValues,
        },
      });
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const allValues = normalizedOptions.map((opt) => opt.value);
    if (onChange) {
      onChange({
        target: {
          name,
          value: allValues,
        },
      });
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: [],
        },
      });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          e.preventDefault();
          handleToggleOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const hasError = Boolean(isInvalid || error);

  return (
    <div
      ref={containerRef}
      className={`${styles.dropdownWrapper} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <div className={styles.labelWrapper}>
          <label htmlFor={dropdownId} className={styles.label}>
            {label}
            {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      {/* Control Trigger */}
      <div
        id={dropdownId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleDropdown}
        className={`
          ${styles.control}
          ${isOpen ? styles.isOpen : ''}
          ${hasError ? styles.invalid : ''}
          ${disabled ? styles.disabled : ''}
        `}
      >
        <div className={styles.chipsContainer}>
          {selectedOptionObjects.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            selectedOptionObjects.map((opt) => (
              <span key={opt.value} className={styles.chip}>
                <span>{opt.label}</span>
                <button
                  type="button"
                  className={styles.chipRemoveBtn}
                  onClick={(e) => handleRemoveChip(e, opt.value)}
                  aria-label={`Remove ${opt.label}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        <div className={styles.indicators}>
          {selectedOptionObjects.length > 0 && (
            <span className={styles.countBadge}>
              {selectedOptionObjects.length}
            </span>
          )}

          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div className={styles.menu}>
          {showActions && (
            <div className={styles.actionsHeader}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleSelectAll}
              >
                Select All
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          )}

          {searchable && (
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Search options"
              />
            </div>
          )}

          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className={styles.optionsList}
            tabIndex={-1}
          >
            {loading ? (
              <li className={styles.loadingState}>Loading options...</li>
            ) : filteredOptions.length === 0 ? (
              <li className={styles.emptyState}>{emptyMessage}</li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isChecked = selectedValues.includes(String(opt.value));
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isChecked}
                    className={`
                      ${styles.optionItem}
                      ${isHighlighted ? styles.highlighted : ''}
                    `}
                    onClick={() => handleToggleOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{opt.label}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {hasError && error && (
        <div id={errorId} className={styles.errorText} role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!hasError && helperText && (
        <div id={helperId} className={styles.helperText}>
          {helperText}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
