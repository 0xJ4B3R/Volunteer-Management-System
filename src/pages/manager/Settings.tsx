// React and Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Internationalization
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

// Icons
import {
  Menu,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Search
} from "lucide-react";

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom Components
import ManagerSidebar from "@/components/manager/ManagerSidebar";

// Utilities and Helpers
import { cn } from "@/lib/utils";
import { validatePassword } from "@/utils/validation";

// Firebase
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

// Constants
const MOBILE_BREAKPOINT = 1024;
const LOADING_DURATION = 1000; // ms

// Types
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Password validation function
const getPasswordError = (password: string): string | null => {
  if (!password || password.trim().length === 0) {
    return 'passwordSettings.errors.passwordRequired';
  }

  if (password.length < 8) {
    return 'passwordSettings.errors.passwordTooShort';
  }

  if (!/[A-Z]/.test(password)) {
    return 'passwordSettings.errors.passwordNoUppercase';
  }

  if (!/[a-z]/.test(password)) {
    return 'passwordSettings.errors.passwordNoLowercase';
  }

  if (!/[0-9]/.test(password)) {
    return 'passwordSettings.errors.passwordNoNumber';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'passwordSettings.errors.passwordNoSpecialChar';
  }

  if (!validatePassword(password)) {
    return 'passwordSettings.errors.passwordInvalid';
  }

  return null;
};

// Password hashing function
const createHash = async (password: string): Promise<string> => {
  try {
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  } catch (error) {
    // Fall through to JavaScript implementation
  }

  // Fallback SHA-256 implementation
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  return await sha256(password);
};

const ManagerSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['settings', 'common']);
  const { language, isRTL, changeLanguage, dir } = useLanguage();
  const { toast } = useToast();

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: null as string | null,
    newPassword: null as string | null,
    confirmPassword: null as string | null
  });

  // Language form state
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);

  // Utility Functions
  const updatePasswordForm = (field: keyof PasswordFormData, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));

    // Validate password on change
    if (field === 'currentPassword') {
      const error = !value ? 'passwordSettings.errors.passwordRequired' : null;
      setPasswordErrors(prev => ({ ...prev, currentPassword: error }));
    } else if (field === 'newPassword') {
      const error = getPasswordError(value);
      setPasswordErrors(prev => ({ ...prev, newPassword: error }));

      // Also validate confirm password if it exists
      if (passwordForm.confirmPassword) {
        const confirmError = value !== passwordForm.confirmPassword ? 'passwordSettings.errors.passwordsDoNotMatch' : null;
        setPasswordErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    } else if (field === 'confirmPassword') {
      const error = value !== passwordForm.newPassword ? 'passwordSettings.errors.passwordsDoNotMatch' : null;
      setPasswordErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setPasswordErrors({
      currentPassword: null,
      newPassword: null,
      confirmPassword: null
    });
  };

  // Event Handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);

    try {
      // Validate all fields
      const currentPasswordError = !passwordForm.currentPassword ? 'passwordSettings.errors.passwordRequired' : null;
      const newPasswordError = getPasswordError(passwordForm.newPassword);
      const confirmPasswordError = passwordForm.newPassword !== passwordForm.confirmPassword ? 'passwordSettings.errors.passwordsDoNotMatch' : null;

      if (currentPasswordError || newPasswordError || confirmPasswordError) {
        setPasswordErrors({
          currentPassword: currentPasswordError,
          newPassword: newPasswordError,
          confirmPassword: confirmPasswordError
        });

        toast({
          title: t('passwordSettings.errors.validationFailed'),
          description: t('passwordSettings.errors.validationFailedDescription'),
          variant: "destructive"
        });
        return;
      }

      // Check if new password is different from current password
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setPasswordErrors(prev => ({ ...prev, newPassword: 'passwordSettings.errors.samePassword' }));
        toast({
          title: t('passwordSettings.errors.samePassword'),
          description: t('passwordSettings.errors.samePasswordDescription'),
          variant: "destructive"
        });
        return;
      }

      // Get current user
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (!user.id) {
        throw new Error("User not found");
      }

      // Find user document by username
      const usersQuery = query(collection(db, "users"), where("username", "==", user.username));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        throw new Error("User document not found");
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const storedPasswordHash = userData.passwordHash;

      if (!storedPasswordHash) {
        throw new Error("No password set for this user");
      }

      // Verify current password
      const isPlainTextPassword = storedPasswordHash.length < 30;
      let passwordMatches = false;

      if (isPlainTextPassword) {
        passwordMatches = passwordForm.currentPassword === storedPasswordHash;
      } else {
        const currentPasswordHash = await createHash(passwordForm.currentPassword);
        passwordMatches = currentPasswordHash === storedPasswordHash;
      }

      if (!passwordMatches) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: 'passwordSettings.errors.incorrectCurrentPassword' }));
        toast({
          title: t('passwordSettings.errors.incorrectCurrentPassword'),
          description: t('passwordSettings.errors.incorrectCurrentPasswordDescription'),
          variant: "destructive"
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await createHash(passwordForm.newPassword);

      // Update password in Firestore
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date()
      });

      // Reset form and show success
      resetPasswordForm();

      toast({
        title: t('passwordSettings.success.passwordChanged'),
        description: t('passwordSettings.success.passwordChangedDescription'),
        variant: "default"
      });

    } catch (error) {
      console.error("Error changing password:", error);

      toast({
        title: t('passwordSettings.errors.changePasswordFailed'),
        description: error instanceof Error ? error.message : t('passwordSettings.errors.changePasswordFailedDescription'),
        variant: "destructive"
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleChangeLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLanguageLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, LOADING_DURATION));
      changeLanguage(selectedLanguage);
      // Add success notification here
    } catch (error) {
      console.error("Error changing language:", error);
      // Add error notification here
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Effects
  useEffect(() => {
    // Check authentication
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    // Handle window resize for sidebar
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Sync selected language with current language
    setSelectedLanguage(language);
  }, [language]);

  // Render Functions
  const renderPasswordInput = (
    field: keyof PasswordFormData,
    label: string,
    placeholder: string,
    requirement?: string
  ) => {
    const error = passwordErrors[field];
    const passwordType = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';

    return (
      <div className="space-y-2">
        <Label htmlFor={field} className={cn(
          "text-sm font-medium text-slate-700",
          isRTL && "text-right"
        )}>
          {label}
        </Label>
        <div className="relative">
          <Input
            id={field}
            type={showPasswords[passwordType] ? "text" : "password"}
            placeholder={placeholder}
            className={cn(
              "focus:outline-none focus-visible:ring-0",
              isRTL ? "pl-10 text-right" : "pr-10",
              error ? "border-red-500 focus:border-red-500" : ""
            )}
            value={passwordForm[field]}
            onChange={(e) => updatePasswordForm(field, e.target.value)}
            required
            dir="ltr"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-slate-100 focus:outline-none focus-visible:ring-0",
              isRTL ? "left-1" : "right-1"
            )}
            onClick={() => togglePasswordVisibility(passwordType)}
          >
            {showPasswords[passwordType] ? (
              <EyeOff className="h-4 w-4 text-slate-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
          </Button>
        </div>
        {error && (
          <p className={cn(
            "text-sm text-red-600",
            isRTL && "text-right"
          )}>
            {t(error)}
          </p>
        )}
        {requirement && !error && (
          <p className={cn(
            "text-xs text-slate-500",
            isRTL && "text-right"
          )}>
            {requirement}
          </p>
        )}
      </div>
    );
  };

  const renderLoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 fixed inset-0" dir={dir}>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-300 shadow-sm z-10 h-[69px] flex-shrink-0">
        <div className="px-6 h-full flex items-center justify-between">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4 w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden focus:outline-none focus-visible:ring-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className={cn(
              "flex items-center space-x-3",
              isRTL && "space-x-reverse"
            )}>
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">
                {t('title')}
              </h1>
            </div>
          </div>
          {/* Center section - Empty for balance */}
          <div className="flex-1"></div>
          {/* Right section - Empty for balance */}
          <div className="w-[200px]"></div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {/* Mobile Search */}
            {isMobile && (
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500",
                    isRTL ? "right-3" : "left-3"
                  )} />
                  <Input
                    placeholder={t('common:actions.search')}
                    className={cn(
                      "bg-white focus:outline-none focus-visible:ring-0 border-slate-200",
                      isRTL ? "pr-9 text-right" : "pl-9"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="space-y-6">
              {/* Language Settings Section */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-300">
                <div className="p-6">
                  <div className={cn(
                    "flex items-center space-x-3 mb-4",
                    isRTL && "space-x-reverse"
                  )}>
                    <Globe className="h-5 w-5 text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {t('languageSettings.title')}
                    </h2>
                  </div>
                  <p className={cn(
                    "text-sm text-slate-600 mb-6",
                    isRTL && "text-right"
                  )}>
                    {t('languageSettings.description')}
                  </p>

                  <form className="space-y-4 max-w-md" onSubmit={handleChangeLanguage}>
                    <div className="space-y-2">
                      <Label htmlFor="language-select" className={cn(
                        "text-sm font-medium text-slate-700",
                        isRTL && "text-right"
                      )}>
                        {t('languageSettings.interfaceLanguage')}
                      </Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage} dir={dir}>
                        <SelectTrigger className={cn(
                          "focus:outline-none focus-visible:ring-0",
                          isRTL && "text-right"
                        )}>
                          <SelectValue placeholder={t('languageSettings.interfaceLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">
                            <div className={cn(
                              "flex items-center space-x-3 w-full",
                              isRTL ? "space-x-reverse justify-end" : "justify-start"
                            )}>
                              <span className="text-lg">🇺🇸</span>
                              <span>{t('common:common.english')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="he">
                            <div className={cn(
                              "flex items-center space-x-3 w-full",
                              isRTL ? "space-x-reverse justify-end" : "justify-start"
                            )}>
                              <span className="text-lg">🇮🇱</span>
                              <span>{t('common:common.hebrew')}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className={cn(
                        "text-xs text-slate-500",
                        isRTL && "text-right"
                      )}>
                        {t('languageSettings.changeEffect')}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLanguageLoading || selectedLanguage === language}
                        className="w-full sm:w-auto focus:outline-none focus-visible:ring-0"
                      >
                        {isLanguageLoading ? (
                          <div className={cn(
                            "flex items-center space-x-2",
                            isRTL && "space-x-reverse"
                          )}>
                            {renderLoadingSpinner()}
                            <span>{t('languageSettings.updating')}</span>
                          </div>
                        ) : (
                          <div className={cn(
                            "flex items-center space-x-2",
                            isRTL && "space-x-reverse"
                          )}>
                            <Globe className="h-4 w-4" />
                            <span>{t('languageSettings.save')}</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-300">
                <div className="p-6">
                  <div className={cn(
                    "flex items-center space-x-3 mb-4",
                    isRTL && "space-x-reverse"
                  )}>
                    <Lock className="h-5 w-5 text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {t('passwordSettings.title')}
                    </h2>
                  </div>
                  <p className={cn(
                    "text-sm text-slate-600 mb-6",
                    isRTL && "text-right"
                  )}>
                    {t('passwordSettings.description')}
                  </p>

                  <form className="space-y-4 max-w-md" onSubmit={handleChangePassword}>
                    {renderPasswordInput(
                      'currentPassword',
                      t('passwordSettings.currentPassword'),
                      t('passwordSettings.currentPasswordPlaceholder')
                    )}

                    {renderPasswordInput(
                      'newPassword',
                      t('passwordSettings.newPassword'),
                      t('passwordSettings.newPasswordPlaceholder'),
                      t('passwordSettings.passwordRequirement')
                    )}

                    {renderPasswordInput(
                      'confirmPassword',
                      t('passwordSettings.confirmPassword'),
                      t('passwordSettings.confirmPasswordPlaceholder')
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={
                          isPasswordLoading ||
                          !passwordForm.currentPassword ||
                          !passwordForm.newPassword ||
                          !passwordForm.confirmPassword ||
                          !!passwordErrors.currentPassword ||
                          !!passwordErrors.newPassword ||
                          !!passwordErrors.confirmPassword
                        }
                        className="w-full sm:w-auto focus:outline-none focus-visible:ring-0"
                      >
                        {isPasswordLoading ? (
                          <div className={cn(
                            "flex items-center space-x-2",
                            isRTL && "space-x-reverse"
                          )}>
                            {renderLoadingSpinner()}
                            <span>{t('passwordSettings.updating')}</span>
                          </div>
                        ) : (
                          <div className={cn(
                            "flex items-center space-x-2",
                            isRTL && "space-x-reverse"
                          )}>
                            <Lock className="h-4 w-4" />
                            <span>{t('passwordSettings.update')}</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Password Security Tips */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h3 className={cn(
                      "font-semibold text-slate-900 mb-3 flex items-center space-x-2",
                      isRTL && "space-x-reverse"
                    )}>
                      <Lock className="h-4 w-4" />
                      <span>{t('passwordSettings.securityTips.title')}</span>
                    </h3>
                    <ul className={cn(
                      "text-sm text-slate-600 space-y-1",
                      isRTL && "text-right"
                    )}>
                      <li>• {t('passwordSettings.securityTips.tip1')}</li>
                      <li>• {t('passwordSettings.securityTips.tip2')}</li>
                      <li>• {t('passwordSettings.securityTips.tip3')}</li>
                      <li>• {t('passwordSettings.securityTips.tip4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerSettings; 