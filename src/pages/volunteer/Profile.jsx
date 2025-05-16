import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, Clock, CheckCircle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './styles/Profile.css';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const [showLangOptions, setShowLangOptions] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const userObject = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;

  const userId = userObject?.uid || userObject?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }

      try {
        const volunteerRef = doc(db, 'volunteers', userId);
        const userRef = doc(db, 'users', userId);

        const [volunteerSnap, userSnap] = await Promise.all([
          getDoc(volunteerRef),
          getDoc(userRef),
        ]);

        if (!volunteerSnap.exists() && !userSnap.exists()) {
          setError('Profile not found in either collection.');
          setLoading(false);
          return;
        }

        const volunteerData = volunteerSnap.exists() ? volunteerSnap.data() : {};
        const userData = userSnap.exists() ? userSnap.data() : {};

        setProfile({ ...volunteerData, ...userData });
      } catch (err) {
        setError('Failed to load profile: ' + err.message);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading)
    return (
      <div className="profile-wrapper">
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <div className="loader" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="profile-wrapper">
        <div className="profile-card" style={{ color: 'red', textAlign: 'center' }}>
          <p>{error}</p>
        </div>
      </div>
    );

  return (
    <div className="profile-wrapper">
      {/* Language Toggle */}
      <div className="language-toggle">
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className="lang-options">
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
              English
            </button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
              עברית
            </button>
          </div>
        )}
      </div>

      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar-container">
            <img
              src={profile.avatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"}
              alt="Profile"
              className="profile-photo"
            />
          </div>
          <h2>{profile.fullName || 'No name found'}</h2>
          <p className="email">{profile.email || 'No email provided'}</p>
          {profile.role && (
            <p className="role">{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</p>
          )}
          <div className="badges-container">
            <div className="profile-badge">⭐ Dedicated Volunteer</div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="profile-stats">
          <div className="stat">
            <Clock className="stat-icon" />
            <h3>{profile.hoursVolunteered || 0}</h3>
            <p>Hours Volunteered</p>
          </div>
          <div className="stat">
            <CheckCircle className="stat-icon" />
            <h3>{profile.sessionsCompleted || 0}</h3>
            <p>Sessions Completed</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-item">
            <h4>Phone</h4>
            <p>{profile.phoneNumber || 'N/A'}</p>
          </div>
          <div className="info-item">
            <h4>Birth Date</h4>
            <p>{profile.birthDate || 'N/A'}</p>
          </div>
          <div className="info-item">
            <h4>Gender</h4>
            <p>{profile.gender || 'N/A'}</p>
          </div>
          <div className="info-item">
            <h4>Languages</h4>
            <div className="interests-tags">
              {(profile.languages && profile.languages.length > 0)
                ? profile.languages.map((lang, i) => (
                  <span key={i} className="interest-tag">{lang}</span>
                ))
                : <span className="interest-tag">N/A</span>
              }
            </div>
          </div>
          <div className="info-item">
            <h4>Skills</h4>
            <div className="interests-tags">
              {(profile.skills && profile.skills.length > 0)
                ? profile.skills.map((skill, i) => (
                  <span key={i} className="interest-tag">{skill}</span>
                ))
                : <span className="interest-tag">N/A</span>
              }
            </div>
          </div>
          <div className="info-item">
            <h4>Hobbies</h4>
            <div className="interests-tags">
              {(profile.hobbies && profile.hobbies.length > 0)
                ? profile.hobbies.map((hobby, i) => (
                  <span key={i} className="interest-tag">{hobby}</span>
                ))
                : <span className="interest-tag">N/A</span>
              }
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="activity-section">
          <div className="recent-activity">
            <p>
              <strong>Last Session:</strong> {profile.lastSession || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
