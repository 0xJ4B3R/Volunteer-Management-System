import { useEffect, useState } from "react";
import {
  User, Phone, CheckCircle2, Lock, Star, BadgeCheck,
  Plus, X, Eye, EyeOff, Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import "./styles/Profile.css";

const userProfile = {
  fullName: "John Volunteer",
  username: "@johnv",
  phone: "(555) 123-4567",
  joinDate: "2023-01-15",
  totalHours: 124,
  completedSessions: 32,
  skills: ["Reading", "Music", "Companionship"]
};

const getLevel = (hours, t) => {
  if (hours >= 100) return { label: t("profile.level.superstar"), icon: <Star size={36} /> };
  if (hours >= 50) return { label: t("profile.level.active"), icon: <BadgeCheck size={36} /> };
  return { label: t("profile.level.beginner"), icon: <CheckCircle2 size={36} /> };
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [skills, setSkills] = useState(userProfile.skills);
  const [progress, setProgress] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLangOptions, setShowLangOptions] = useState(false);

  useEffect(() => {
    const value = Math.min(userProfile.totalHours, 100);
    setTimeout(() => setProgress((value / 100) * 565.48), 200);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const formattedDate = new Date(userProfile.joinDate).toLocaleDateString(
    i18n.language === "he" ? "he" : "en",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const addSkill = () => {
    const newSkill = prompt(t("profile.prompt.newSkill"));
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      toast({ title: t("profile.toast.addedTitle"), description: t("profile.toast.addedDesc", { skill: newSkill }) });
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
    toast({ title: t("profile.toast.removedTitle"), description: t("profile.toast.removedDesc", { skill }) });
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast({ title: t("profile.toast.errorTitle"), description: t("profile.toast.errorDesc"), variant: "destructive" });
      return;
    }
    toast({ title: t("profile.toast.successTitle"), description: t("profile.toast.successDesc") });
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const level = getLevel(userProfile.totalHours, t);

  return (
    <div className="profile-page" dir={i18n.language === "he" ? "rtl" : "ltr"}>
      {/* Language toggle */}
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>English</button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>עברית</button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">{t("profile.title")}</h1>
        <p className="profile-subtitle">{t("profile.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <div className={`tabs ${i18n.language === "he" ? "tabs-rtl" : ""}`}>
          {i18n.language === "he" ? (
            <>
              <button className={`tab-item ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                <Lock size={20} /> {t("profile.tabs.security")}
              </button>
              <button className={`tab-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                <User size={20} /> {t("profile.tabs.info")}
              </button>
            </>
          ) : (
            <>
              <button className={`tab-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                <User size={20} /> {t("profile.tabs.info")}
              </button>
              <button className={`tab-item ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                <Lock size={20} /> {t("profile.tabs.security")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="profile-content">
        {activeTab === "profile" && (
          <div className="profile-overview">
            <div className="profile-header-content">
              {/* Avatar & name */}
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <User size={64} />
                </div>
                <div className="profile-name-details">
                  <h3 className="profile-name">{userProfile.fullName}</h3>
                  <p className="profile-joined">{t("profile.memberSince")}: {formattedDate}</p>
                </div>
              </div>

              {/* Hours circle */}
              <div className="profile-hours">
                <div className="hours-progress-container">
                  <svg className="circle-progress" viewBox="0 0 200 200">
                    <circle className="circle-bg" cx="100" cy="100" r="90" strokeWidth="10" />
                    <circle className="circle-value" cx="100" cy="100" r="90" strokeWidth="10"
                      strokeDasharray="565.48" strokeDashoffset={565.48 - progress} />
                  </svg>
                  <div className="hours-display">
                    <span className="hours-number">{userProfile.totalHours}</span>
                    <span className="hours-label">{t("profile.totalHours")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="profile-stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><User size={36} /></div>
                <p className="stat-label">{t("profile.username")}</p>
                <p className="stat-value"><span dir="ltr">{userProfile.username}</span></p>
              </div>
              <div className="stat-card">
                <div className="stat-icon badge-icon-container">{level.icon}</div>
                <p className="stat-label">{t("profile.status")}</p>
                <p className="stat-value">{level.label}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Phone size={36} /></div>
                <p className="stat-label">{t("profile.phone")}</p>
                <p className="stat-value"><span dir="ltr">{userProfile.phone}</span></p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><CheckCircle2 size={36} /></div>
                <p className="stat-label">{t("profile.completedSessions")}</p>
                <p className="stat-value">{userProfile.completedSessions}</p>
              </div>
            </div>

            {/* Skills section */}
            <div className="skills-section">
              <h4 className="section-title">{t("profile.skills")}</h4>
              <div className="skills-list">
                {skills.map((skill, i) => (
                  <span className="skill-badge" key={i}>
                    {skill}
                    <X size={14} className="remove-skill" onClick={() => removeSkill(skill)} />
                  </span>
                ))}
                <button className="add-skill-btn" onClick={addSkill}>
                  <Plus size={14} /> {t("profile.addSkill")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {activeTab === "security" && (
          <div className="security-section">
            <div className="profile-overview">
              <h4 className="section-title">{t("profile.changePassword")}</h4>
              <div className="password-form">
                {[
                  { label: t("profile.currentPassword"), value: currentPassword, set: setCurrentPassword, toggle: showCurrent, setToggle: setShowCurrent },
                  { label: t("profile.newPassword"), value: newPassword, set: setNewPassword, toggle: showNew, setToggle: setShowNew },
                  { label: t("profile.confirmPassword"), value: confirmPassword, set: setConfirmPassword, toggle: showConfirm, setToggle: setShowConfirm }
                ].map((field, i) => (
                  <div className="form-group" key={i}>
                    <label className="form-label">{field.label}</label>
                    <div className="password-input-container">
                      <input
                        className="password-input"
                        type={field.toggle ? "text" : "password"}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                      />
                      <button
                        type="button"
                        className="toggle-visibility"
                        onClick={() => field.setToggle(!field.toggle)}
                      >
                        {field.toggle ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button className="submit-button" onClick={handlePasswordChange}>
                  {t("profile.confirmChange")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
