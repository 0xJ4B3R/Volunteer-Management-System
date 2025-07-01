import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Globe } from 'lucide-react';
import LoadingScreen from '@/components/volunteer/LoadingScreen';
import WarningLoadingScreen from '@/components/volunteer/WarningLoadingScreen'; // Import the new component
import './styles/Login.css';

export default function LoginPage() {
  const { t, i18n } = useTranslation('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDefaultPasswordWarning, setShowDefaultPasswordWarning] = useState(false); // New state
  const [error, setError] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t("login.error_fill_fields"));
      return;
    }

    try {
      setLoading(true);

      const userCollection = collection(db, "users");
      const q = query(userCollection, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (querySnapShot.empty) {
        setError(t("login.error_user_not_found"));
        setLoading(false);
        return;
      }

      const userDoc = querySnapShot.docs[0];
      const userData = userDoc.data();
      const role = userData.role;

      if (!userData.isActive) {
        setError(t("login.error_user_inactive"));
        setLoading(false);
        return;
      }

      // SHA-256 encryption function (keep your existing implementation)
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

        // JavaScript fallback implementation
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
          setError(t("login.error_login_failed"));
          setLoading(false);
          return;
        }
      }

      if (passwordMatches) {
        // Check if user is using the default password
        let isDefaultPassword = false;

        if (!isHashedPassword) {
          // Plain text comparison for old passwords
          isDefaultPassword = password === "Welcome123!";
        } else {
          // Hash comparison for new passwords
          try {
            const defaultPasswordHash = await sha256("Welcome123!");
            isDefaultPassword = storedPassword === defaultPasswordHash;
          } catch (hashError) {
            console.error("Error checking default password:", hashError);
          }
        }

        // Store user data in localStorage
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userDoc.id);
        localStorage.setItem("username", username);
        localStorage.setItem("user", JSON.stringify({
          id: userDoc.id,
          username: userData.username,
          role: userData.role,
        }));

        if (isDefaultPassword) {
          // Set flags for default password detection
          localStorage.setItem("requirePasswordChange", "true");
          localStorage.setItem("isDefaultPassword", "true");
          localStorage.setItem("showPasswordWarning", "true");

          // Switch to warning loading screen
          setLoading(false);
          setShowDefaultPasswordWarning(true);

          // Navigate after showing warning for 15 seconds
          setTimeout(() => {
            if (role === 'volunteer') {
              navigate('/volunteer/profile?tab=security&warning=true');
            } else if (role === 'manager') {
              navigate('/manager/profile?tab=security&warning=true');
            } else {
              setError(t("login.error_invalid_role"));
              setShowDefaultPasswordWarning(false);
            }
          }, 15000); // 15 second delay
        } else {
          // Normal login flow - navigate to dashboard
          setTimeout(() => {
            if (role === 'volunteer') {
              navigate('/volunteer');
            } else if (role === 'manager') {
              navigate('/manager');
            } else {
              setError(t("login.error_invalid_role"));
              setLoading(false);
            }
          }, 2000);
        }
      } else {
        setError(t("login.error_wrong_credentials"));
        setLoading(false);
      }

    } catch (error) {
      console.error("Login error:", error);
      setError(t("login.error_login_failed"));
      setLoading(false);
    }
  };

  // Show warning loading screen if default password detected
  if (showDefaultPasswordWarning) {
    return <WarningLoadingScreen isDefaultPassword={true} countdownSeconds={15} />;
  }

  // Show regular loading screen
  if (loading) {
    return <LoadingScreen />;
  }

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
            src="./public/logo.png"
            alt="Login Logo"
            className="login-logo"
          />
        </div>

        <div className="login-form-section">
          <h1 className="login-title">{t("login.login_title")}</h1>
          <p className="login-subtitle">{t("login.login_subtitle")}</p>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="username">{t("login.username")}</label>
              <input
                id="username"
                type="text"
                placeholder={t("login.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group password-group">
              <label className="form-label" htmlFor="password">{t("login.password")}</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.password")}
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
              type="submit"
              className="login-button"
            >
              {t("login.login_button")}
            </button>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <a href="/" className="forgot-password-link">
              {t("login.Back_to_home_page")}
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
