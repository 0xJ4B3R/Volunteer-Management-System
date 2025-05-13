import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

import './styles/Dashboard.css';

function VolunteerDashboard() {
  const [volunteerData, setVolunteerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get username from localStorage
  const username = localStorage.getItem('username');
  const userObject = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const usernameFromObject = userObject?.username;

  useEffect(() => {
    const fetchVolunteerData = async () => {
      // Use either direct username or from user object
      const userIdentifier = username || usernameFromObject;
      
      if (userIdentifier) {
        try {
          console.log('Fetching data for username:', userIdentifier);
          const volunteerRef = collection(db, 'Volunteer');
          
          // Query by username
          const q = query(volunteerRef, where('username', '==', userIdentifier));
          
          console.log('About to execute Firestore query...');
          const querySnapshot = await getDocs(q);
          console.log('Query executed successfully. Documents found:', !querySnapshot.empty);
          
          if (!querySnapshot.empty) {
            const volunteerDoc = querySnapshot.docs[0];
            const data = volunteerDoc.data();
            console.log('Volunteer data retrieved:', data);

            // Set the data to state
            setVolunteerData({
              ...data,
              skills: Array.isArray(data.skills) ? data.skills : [],
              totalHoursVolunteered: data.totalHoursVolunteered || 0
            });
          } else {
            console.log('No volunteer found with username:', userIdentifier);
            setError('Could not find your volunteer profile. Please contact support.');
          }
        } catch (err) {
          console.error('Error fetching volunteer data:', err);
          
          if (err.code === 'permission-denied') {
            setError('Access denied. You do not have permission to view this data. Please contact an administrator.');
          } else {
            setError(`Error loading your profile: ${err.message}`);
          }
        }
      } else {
        console.log('No username found in localStorage');
        setError('You are not logged in. Please log in to view your dashboard.');
      }
      setLoading(false);
    };

    fetchVolunteerData();
  }, [username, usernameFromObject]);

  const stats = volunteerData ? [
    {
      label: "Hours Volunteered",
      value: volunteerData.totalHoursVolunteered || 0,
      color: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      label: "Projects Completed",
      value: volunteerData.projectsCompleted || 0,
      color: "bg-green-50",
      border: "border-green-200"
    },
    {
      label: "Skills",
      value: volunteerData.skills?.length || 0,
      color: "bg-purple-50",
      border: "border-purple-200"
    }
  ] : [];

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="text-sm mt-4 p-4 bg-gray-100 rounded">
          <p><strong>Troubleshooting:</strong></p>
          <ul className="list-disc pl-5 mt-2">
            <li>Check your Firebase security rules</li>
            <li>Make sure you're logged in properly</li>
            <li>Verify the 'Volunteer' collection exists</li>
          </ul>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="dashboard-retry-button mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-welcome-text">
            Welcome, {volunteerData?.fullName || 'Volunteer'}!
          </h1>
          <p className="dashboard-thankyou-text">
            Thank you for making a difference in your community.
          </p>
        </div>
        {volunteerData?.avatar && (
          <img
            src={volunteerData.avatar}
            alt="Volunteer"
            className="dashboard-avatar"
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`dashboard-stat-card ${stat.color} ${stat.border}`}
          >
            <div>
              <div className="dashboard-stat-label">{stat.label}</div>
              <div className="dashboard-stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills Section */}
      {volunteerData?.skills && volunteerData.skills.length > 0 && (
        <div className="dashboard-skills">
          <h3 className="skills-heading">My Skills:</h3>
          <ul className="skills-list">
            {volunteerData.skills.map((skill, index) => (
              <li key={index} className="skill-item">{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;