import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Globe } from 'lucide-react';

import LoadingScreen from '@/components/volunteer/LoadingScreen';
import './styles/Login.css';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t("error_fill_fields"));
      return;
    }

    try {
      setLoading(true);
      
      const userCollection = collection(db, "users");
      const q = query(userCollection, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (querySnapShot.empty) {
        setError(t("error_user_not_found"));
        setLoading(false);
        return;
      }

      const userDoc = querySnapShot.docs[0];
      const userData = userDoc.data();
      const role = userData.role;
      
      if (!userData.isActive) {
        setError(t("error_user_inactive"));
        setLoading(false);
        return;
      }

      // Check password - handle both hashed and plain text passwords
      const storedPassword = userData.passwordHash;
      const isPlainTextPassword = storedPassword.length < 20; // SHA-256 hashes are 64 characters
      let passwordMatches = false;

      if (isPlainTextPassword) {
        // Plain text comparison for old passwords
        console.log("Comparing plain text password");
        passwordMatches = password === storedPassword;
      } else {
        // Hash comparison for new passwords
        console.log("Comparing hashed password");
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        passwordMatches = passwordHash === storedPassword;
      }

      if (passwordMatches) {
        // Store user data in localStorage
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userDoc.id);
        localStorage.setItem("username", username);
        localStorage.setItem("user", JSON.stringify({
          id: userDoc.id,
          username: userData.username,
          role: userData.role,
        }));

        // Navigate based on role after a delay
        setTimeout(() => {
          if (role === 'volunteer') {
            navigate('/volunteer');
          } else if (role === 'manager') {
            navigate('/manager');
          } else {
            setError(t("error_invalid_role"));
            setLoading(false);
          } 
        }, 2000);
      } else {
        setError(t("error_wrong_credentials"));
        setLoading(false);
      }

    } catch (error) {
      console.error("Login error:", error);
      setError(t("error_login_failed"));
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="login-page">
      {/* Language selector - bottom-right / bottom left according to language */}
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
              English
            </button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
              עברית
            </button>
          </div>
        )}
      </div>

      <div className="login-container">
        <div className="login-logo-section">
          <img
            src="./public/newLogo.png"
            alt="Login Logo"
            className="login-logo"
          />
        </div>

        <div className="login-form-section">
          <h1 className="login-title">{t("login_title")}</h1>
          <p className="login-subtitle">{t("login_subtitle")}</p>

          <div className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">{t("username")}</label>
              <input
                id="username"
                type="text"
                placeholder={t("username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group password-group">
              <label className="form-label" htmlFor="password">{t("password")}</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              className="login-button"
              onClick={handleLogin}
            >
              {t("login_button")}
            </button>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <a href="/forgot-password" className="forgot-password-link">
              {t("forgot_password")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}