import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

/**
 * Shows an "Add to Home Screen" / "Install App" prompt when the PWA is installable.
 * Only appears on supported browsers (Chrome, Edge, Samsung Internet, etc.) and when not already installed.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!wasDismissed) setShowPrompt(true);
    };

    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (alreadyInstalled) return;

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 400,
        margin: '0 auto',
        padding: '12px 16px',
        background: 'var(--card-bg, #fff)',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid var(--border-color, #e0e0e0)',
      }}
    >
      <span style={{ flex: 1, fontSize: 14 }}>
        Install GEN-C on your device for quick access
      </span>
      <Button size="sm" variant="primary" onClick={handleInstall}>
        Install
      </Button>
      <Button size="sm" variant="outline-secondary" onClick={handleDismiss}>
        Not now
      </Button>
    </div>
  );
}
