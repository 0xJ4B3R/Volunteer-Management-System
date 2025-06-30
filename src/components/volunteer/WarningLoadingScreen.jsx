import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const WarningLoadingScreen = ({ isDefaultPassword = false, message = null, countdownSeconds = 15 }) => {
  const { t, i18n } = useTranslation();
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [started, setStarted] = useState(false);

  // Start the countdown after a brief delay to ensure user sees the initial number
  useEffect(() => {
    if (isDefaultPassword) {
      setCountdown(countdownSeconds);
      const startTimer = setTimeout(() => {
        setStarted(true);
      }, 500); // Wait 500ms before starting countdown
      
      return () => clearTimeout(startTimer);
    }
  }, [isDefaultPassword, countdownSeconds]);

  // Main countdown timer
  useEffect(() => {
    if (isDefaultPassword && started && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isDefaultPassword, started]);

  // Create countdown message
  const getCountdownMessage = () => {
    if (i18n.language === 'he') {
      return `מעביר לשינוי סיסמה בעוד ${countdown} שניות...`;
    } else {
      return `Redirecting to password change in ${countdown} seconds...`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f2f4f6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      direction: i18n.language === 'he' ? 'rtl' : 'ltr',
      minHeight: '100vh',
      minHeight: '100dvh', // Dynamic viewport height for mobile
      overflowY: 'auto'
    }}>
      {/* Loading Spinner - Smaller for mobile */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid #e5e7eb',
        borderTop: isDefaultPassword ? '3px solid #ef4444' : '3px solid #416a42',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem',
        flexShrink: 0
      }}></div>

      {/* Warning Message for Default Password */}
      {isDefaultPassword && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          maxWidth: '90%',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '0.75rem',
            lineHeight: '1'
          }}>
            ⚠️
          </div>
          <h2 style={{
            color: '#dc2626',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            margin: '0 0 0.75rem 0',
            lineHeight: '1.3'
          }}>
            {i18n.language === 'he' ? 'התראת אבטחה' : 'Security Alert'}
          </h2>
          <p style={{
            color: '#7f1d1d',
            fontSize: '1rem',
            lineHeight: '1.5',
            margin: '0 0 1rem 0'
          }}>
            {t("login.default_password_warning")}
          </p>
          <div style={{
            backgroundColor: '#fef2f2',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexDirection: i18n.language === 'he' ? 'row-reverse' : 'row',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: '#dc2626',
              color: 'white',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {countdown}
            </div>
            <span style={{
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              {getCountdownMessage()}
            </span>
          </div>
        </div>
      )}

      {/* Custom Message */}
      {message && !isDefaultPassword && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1rem',
          maxWidth: '90%',
          width: '100%',
          maxWidth: '350px',
          textAlign: 'center',
          color: '#0c4a6e',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {message}
        </div>
      )}

      {/* Default Loading Message */}
      {!isDefaultPassword && !message && (
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          textAlign: 'center',
          margin: 0,
          padding: '0 1rem'
        }}>
          {t("loading") || "Loading..."}
        </p>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile-specific styles */
        @media (max-width: 480px) {
          .countdown-text {
            font-size: 0.875rem;
          }
        }
        
        /* Prevent zoom on focus for iOS */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          input, select, textarea, button {
            font-size: 16px;
          }
        }
        
        /* Safe area handling for notched devices */
        @supports (padding: max(0px)) {
          .mobile-container {
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
          }
        }
      `}</style>
    </div>
  );
};

export default WarningLoadingScreen;