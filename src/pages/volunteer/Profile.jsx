import { useState } from 'react';
import './styles/Profile.css';

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "Jhonny Sahures",
    email: "JhonnySahures@google.com",
  });

  const toggleEdit = () => setEditing(!editing);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
          alt="Profile"
          className="profile-photo"
        />

        {!editing ? (
          <>
            <div className="profile-info">
              <h2>{formData.name}</h2>
              <p>{formData.email}</p>
            </div>

            <div className="profile-stats">
              <div className="stat">
                <h3>42</h3>
                <p>Hours Volunteered</p>
              </div>
              <div className="stat">
                <h3>18</h3>
                <p>Sessions Completed</p>
              </div>
            </div>

            <div className="profile-badge">⭐ Dedicated Volunteer</div>

            <div className="recent-activity">
              <p><strong>Last Session:</strong> May 10, 2025</p>
            </div>

            <button className="edit-btn" onClick={toggleEdit}>Edit Profile</button>
          </>
        ) : (
          <div className="edit-section">
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            <button className="save-btn" onClick={toggleEdit}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
