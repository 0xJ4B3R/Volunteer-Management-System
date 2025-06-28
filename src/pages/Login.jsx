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

      // SHA-256 encryption
      const sha256 = async (message) => {
        // Trying native.subtle
        if (crypto.subtle) {
          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          } catch (error) {
            console.error("crypto.subtle failed, falling back to JS implementation", error);
          }
        }

        // If native.subtle fails
        function sha256Fallback(ascii) {
          function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
          }

          var mathPow = Math.pow;
          var maxWord = mathPow(2, 32);
          var lengthProperty = 'length';
          var i, j;
          var result = '';
        
          var words = [];
          var asciiBitLength = ascii[lengthProperty] * 8;

          var hash = sha256Fallback.h = sha256Fallback.h || [];
          var k = sha256Fallback.k = sha256Fallback.k || [];
          var primeCounter = k[lengthProperty];
        
          var isComposite = {};
          for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
              for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
              }
              hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
              k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
          }

          ascii += '\x80';
          while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
          for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return;
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
          }
          words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
          words[words[lengthProperty]] = (asciiBitLength);

          for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16);
            var oldHash = hash;
            hash = hash.slice(0, 8);

            for (i = 0; i < 64; i++) {
              var i2 = i + j;
              var w15 = w[i - 15], w2 = w[i - 2];
            
              var a = hash[0], e = hash[4];
              var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                  ) | 0
                );
              var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
              
              hash = [(temp1 + temp2) | 0].concat(hash);
              hash[4] = (hash[4] + temp1) | 0;
            }

            for (i = 0; i < 8; i++) {
              hash[i] = (hash[i] + oldHash[i]) | 0;
            }
          }

          for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
              var b = (hash[i] >> (j * 8)) & 255;
              result += ((b < 16) ? 0 : '') + b.toString(16);
            }
          }
          return result;
        }

        return sha256Fallback(message);
      };

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
          const passwordHash = await sha256(password);
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