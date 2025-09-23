import React, { useState, useEffect, useRef } from 'react';
import { getDocs, query, where } from "firebase/firestore";
import { usersRef } from '@/services/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Globe } from 'lucide-react';
import LoadingScreen from '@/components/volunteer/LoadingScreen';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { loginSuccess } from '@/store/slices/authSlice';
import { createHash } from '@/utils/crypto';
import './styles/Login.css';

export default function LoginPage() {
  const { t, i18n } = useTranslation('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const langToggleRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Robust language direction management
  const applyLanguageDirection = (lang) => {
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    
    // 1. Set the dir attribute on html element
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    
    // 2. Remove any stale RTL/LTR classes
    document.body.classList.remove('rtl', 'ltr');
    document.documentElement.classList.remove('rtl', 'ltr');
    
    // 3. Add the correct direction class
    document.body.classList.add(dir);
    document.documentElement.classList.add(dir);
    
    // 4. Set CSS direction property explicitly
    document.body.style.direction = dir;
    document.documentElement.style.direction = dir;
    
    // 5. Remove any conflicting inline styles
    const rootElements = document.querySelectorAll('[style*="direction"]');
    rootElements.forEach(el => {
      if (el !== document.body && el !== document.documentElement) {
        el.style.direction = '';
      }
    });
  };

  useEffect(() => {
    applyLanguageDirection(currentLanguage);
  }, [currentLanguage]);

  // Sync currentLanguage with i18n.language
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language);
    }
  }, [i18n.language, currentLanguage]);

  // Handle click outside language toggle to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langToggleRef.current && !langToggleRef.current.contains(event.target)) {
        setShowLangOptions(false);
      }
    };

    if (showLangOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangOptions]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t("error_fill_fields"));
      return;
    }

    try {
      setLoading(true);
      
      const q = query(usersRef, where("username", "==", username));
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

      // Use the shared crypto utility for consistent hashing across all devices

      // Check password - handle both hashed and plain text passwords
      const storedPassword = userData.passwordHash;
      const isHashedPassword = storedPassword.length === 64 && /^[a-f0-9]+$/i.test(storedPassword);
      let passwordMatches = false;

      if (!isHashedPassword) {
        // Plain text comparison for old passwords
        passwordMatches = password === storedPassword;
      } else {
        // Hash comparison for new passwords
        try {
          const passwordHash = await createHash(password);
          passwordMatches = passwordHash === storedPassword;
        } catch (hashError) {
          console.error("Hashing error:", hashError);
          setError(t("error_login_failed"));
          setLoading(false);
          return;
        }
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

        // Update Redux state
        dispatch(loginSuccess({
          user: {
            id: userDoc.id,
            username: userData.username,
            role: userData.role,
            email: userData.email || '' // Provide fallback for email
          },
          token: 'firebase-authenticated' // Provide a token indicator
        }));

        // Navigate based on role immediately (no delay needed)
        if (role === 'volunteer') {
          navigate('/volunteer');
        } else if (role === 'manager') {
          navigate('/manager');
        } else {
          setError(t("error_invalid_role"));
          setLoading(false);
        }
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
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`} ref={langToggleRef}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe className="lang-icon" />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={async () => {
              localStorage.setItem('language', 'en');
              await i18n.changeLanguage('en');
              setCurrentLanguage('en');
              applyLanguageDirection('en');
              setShowLangOptions(false);
            }}>
              English
            </button>
            <button onClick={async () => {
              localStorage.setItem('language', 'he');
              await i18n.changeLanguage('he');
              setCurrentLanguage('he');
              applyLanguageDirection('he');
              setShowLangOptions(false);
            }}>
              עברית
            </button>
          </div>
        )}
      </div>

      <div className="login-container">
        <div className="login-logo-section">
          <img
            src="/logo.png"
            alt="Login Logo"
            className="login-logo"
          />
        </div>

        <div className="login-form-section">
          <h1 className="login-title">{t("login_title")}</h1>
          <p className="login-subtitle">{t("login_subtitle")}</p>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();  // Prevent default form submission behavior
              handleLogin();       // Trigger login function
            }}
          >
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
              type = "submit"
              className="login-button"
            >
              {t("login_button")}
            </button>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <a href="/" className="forgot-password-link">
              {t("Back_to_home_page")}
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}