/**
 * @file Dialog.jsx
 * @description Accessible, reusable modal dialog with backdrop, focus handling, and customizable actions.
 */

import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

/**
 * Reusable Dialog (Modal) component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether the dialog is displayed.
 * @param {Function} props.onClose - Callback triggered to close dialog.
 * @param {React.ReactNode} props.title - Title text or element.
 * @param {React.ReactNode} props.children - Modal body content.
 * @param {React.ReactNode} [props.footer] - Custom footer override.
 * @param {Function} [props.onConfirm] - Callback for confirm button.
 * @param {string} [props.confirmText='Confirm'] - Label for confirm action.
 * @param {string} [props.cancelText='Cancel'] - Label for cancel action.
 * @param {'primary'|'danger'} [props.confirmVariant='primary'] - Style variant for confirm button.
 * @param {boolean} [props.isConfirmLoading=false] - Loading indicator on confirm button.
 * @param {boolean} [props.isConfirmDisabled=false] - Disabled state for confirm action.
 * @param {boolean} [props.showCancel=true] - Whether to render cancel button.
 * @param {boolean} [props.closeOnBackdropClick=true] - Whether clicking overlay closes modal.
 * @param {boolean} [props.closeOnEscape=true] - Whether pressing Escape key closes modal.
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size='md'] - Dialog size variant.
 * @param {string} [props.className] - Additional wrapper class.
 * @returns {JSX.Element|null} Dialog portal or null if not open.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isConfirmLoading = false,
  isConfirmDisabled = false,
  showCancel = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  className = '',
}) {
  const generatedId = useId();
  const titleId = `dialog-title-${generatedId}`;
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size styling map
  const sizeClasses = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
    full: styles.sizeFull,
  };

  // Keyboard escape & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    // Cache active element before opening
    previousActiveElement.current = document.activeElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog container
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      // Restore previous focus
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const confirmBtnClass = confirmVariant === 'danger' ? styles.btnDanger : styles.btnPrimary;

  const content = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`${styles.dialog} ${sizeClasses[size] || styles.sizeMd} ${className}`}
      >
        {/* Header */}
        <div className={styles.header}>
          {title && (
            <h3 id={titleId} className={styles.title}>
              {title}
            </h3>
          )}
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.body}>{children}</div>

        {/* Footer */}
        {footer !== undefined ? (
          footer
        ) : (
          <div className={styles.footer}>
            {showCancel && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={onClose}
                disabled={isConfirmLoading}
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                type="button"
                className={`${styles.btn} ${confirmBtnClass}`}
                onClick={onConfirm}
                disabled={isConfirmDisabled || isConfirmLoading}
              >
                {isConfirmLoading && <span className={styles.spinner} aria-hidden="true" />}
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default Dialog;
