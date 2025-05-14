import React, { useState } from 'react';
import './styles/ForgotPassword.css';

export default function ForgotPassword() {
  const [input, setInput] = useState('');

  function handleReset() {
    alert("Works");
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1 className="forgot-password-title">Reset your password</h1>
        <p className="forgot-password-description">
          Enter the phone number associated with your account and we'll send you a one time code to confirm your identity
        </p>
        
        <div className="input-container">
          <input
            className="phone-input"
            type="text"
            placeholder="Phone number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        
        <button
          className="send-code-button"
          onClick={handleReset}
        >
          Send Code
        </button>
        
        <div className="back-to-login">
          <a href="/" className="back-link">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}