import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/ForgotPassword.css';

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  function handleReset() {
    alert("Works");
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1 className="forgot-password-title">{t('forgot-password-title')}</h1>
        <p className="forgot-password-description">
          {t('forgot-password-description')}
        </p>

        <div className="input-container">
          <input
            className="phone-input"
            type="text"
            placeholder={t('Enter a phone number')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <button
          className="send-code-button"
          onClick={handleReset}
        >
          {t('send-code-button')}
        </button>

        <div className="back-to-login">
          <a href="/" className="back-link">
            {t('back-to-login')}
          </a>
        </div>
      </div>
    </div>
  );
}
