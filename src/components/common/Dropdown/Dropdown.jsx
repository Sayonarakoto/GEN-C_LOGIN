/**
 * @file Dropdown.jsx
 * @description Accessible single-select dropdown with search filtering, custom key mapping, and keyboard navigation.
 */

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import styles from './Dropdown.module.css';

/**
 * Dropdown Single-Select Component.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.id] - Element ID.
 * @param {string} [props.name] - Form field name identifier.
 * @param {string} [props.label] - Field label text.
 * @param {Array<Object|string|number>} [props.options=[]] - List of selectable options.
 * @param {*} [props.value] - Currently selected value.
 * @param {Function} [props.onChange] - Callback invoked when an option is selected.
 * @param {Function} [props.onBlur] - Callback invoked when focus leaves the component.
 * @param {string} [props.placeholder='Select an option'] - Placeholder text.
 * @param {boolean} [props.required=false] - Whether selection is required.
 * @param {boolean} [props.disabled=false] - Disabled state.
 * @param {boolean} [props.searchable=true] - Whether to show search filter input.
 * @param {string} [props.searchPlaceholder='Search options...'] - Placeholder for search input.
 * @param {boolean} [props.clearable=false] - Whether to show clear button.
 * @param {boolean} [props.loading=false] - Whether options are currently loading.
 * @param {string} [props.emptyMessage='No options found'] - Message when no options match filter.
 * @param {string} [props.valueKey='value'] - Property name for option value.
 * @param {string} [props.labelKey='label'] - Property name for option label.
 * @param {string} [props.error] - Validation error message.
 * @param {boolean} [props.isInvalid=false] - Explicit invalid flag.
 * @param {string} [props.helperText] - Supporting helper text.
 * @param {string} [props.className] - Custom wrapper class.
 * @returns {JSX.Element} Dropdown component.
 */
export function Dropdown({
  id: customId,
  name,
  label,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  searchable = true,
  searchPlaceholder = 'Search options...',
  clearable = false,
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
  const dropdownId = customId || `dropdown-${name || generatedId}`;
  const listboxId = `${dropdownId}-listbox`;
  const errorId = `${dropdownId}-error`;
  const helperId = `${dropdownId}-helper`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

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

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [normalizedOptions, searchTerm]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (isOpen) {
          setIsOpen(false);
          setSearchTerm('');
          if (onBlur) {
            onBlur({ target: { name, value } });
          }
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, name, onBlur, value]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen, searchable]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchTerm('');
  };

  const handleSelectOption = useCallback(
    (option) => {
      const selectedVal = option ? option.value : '';
      if (onChange) {
        // Support standard react event target format
        onChange({
          target: {
            name,
            value: selectedVal,
          },
        });
      }
      setIsOpen(false);
      setSearchTerm('');
    },
    [name, onChange]
  );

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: '',
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
          handleSelectOption(filteredOptions[highlightedIndex]);
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

      {/* Dropdown Control Trigger */}
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
        <div className={styles.valueDisplay}>
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>

        <div className={styles.indicators}>
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className={styles.menu}>
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
            ref={listRef}
            id={listboxId}
            role="listbox"
            className={styles.optionsList}
            tabIndex={-1}
          >
            {loading ? (
              <li className={styles.loadingState}>Loading options...</li>
            ) : filteredOptions.length === 0 ? (
              <li className={styles.emptyState}>{emptyMessage}</li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`
                      ${styles.optionItem}
                      ${isSelected ? styles.selected : ''}
                      ${isHighlighted ? styles.highlighted : ''}
                    `}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className={styles.checkIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
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

export default Dropdown;
