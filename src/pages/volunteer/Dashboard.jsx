import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Clock, CalendarClock, Calendar, MapPin, UserCircle, CheckCircle } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

import './styles/Dashboard.css';

function VolunteerDashboard() {
  const [volunteerData, setVolunteerData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get username from localStorage
  const username = localStorage.getItem('username');
  const userObject = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const usernameFromObject = userObject?.username;

  useEffect(() => {
    const fetchData = async () => {
      const userIdentifier = username || usernameFromObject;
      
      if (userIdentifier) {
        try {
          // Fetch volunteer data
          const volunteerRef = collection(db, 'Volunteer');
          const q = query(volunteerRef, where('username', '==', userIdentifier));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const volunteerDoc = querySnapshot.docs[0];
            const data = volunteerDoc.data();
            const volunteerId = volunteerDoc.id;

            // Set the volunteer data to state
            setVolunteerData({
              ...data,
              id: volunteerId,
              skills: Array.isArray(data.skills) ? data.skills : [],
              totalHoursVolunteered: data.totalHoursVolunteered || 0
            });
            
            // Fetch appointments data
            await fetchAppointments(volunteerId);
          } else {
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
        setError('You are not logged in. Please log in to view your dashboard.');
      }
      setLoading(false);
    };

    const fetchAppointments = async (volunteerId) => {
      try {
        const appointmentsRef = collection(db, 'Appointments');
        const q = query(
          appointmentsRef, 
          where('volunteerId', '==', volunteerId),
          where('date', '>=', new Date().toISOString().split('T')[0]),
          orderBy('date', 'asc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const appointmentsData = [];
        
        querySnapshot.forEach((doc) => {
          appointmentsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };

    fetchData();
  }, [username, usernameFromObject]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Handle both HH:MM format and full ISO strings
    let hours, minutes;
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      [hours, minutes] = timeString.split(':').map(Number);
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const stats = volunteerData ? [
    {
      label: "Hours Volunteered",
      value: volunteerData.totalHoursVolunteered || 0,
      icon: Clock,
      color: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      label: "Upcoming Appointments",
      value: appointments.length || 0,
      icon: CalendarClock,
      color: "bg-green-50",
      border: "border-green-200"
    },
    {
      label: "Appointments Attended",
      value: volunteerData.skills?.length || 0,
      icon: CheckCircle,
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
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`dashboard-stat-card ${stat.color} ${stat.border} flex items-center gap-4 p-4 rounded-lg shadow-sm`}
            >
              {Icon && <Icon className="w-6 h-6 text-gray-600" />}
              <div>
                <div className="dashboard-stat-label font-medium">{stat.label}</div>
                <div className="dashboard-stat-value text-xl font-bold">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Appointments Section */}
      <div className="dashboard-appointments">
        <div className="appointments-header">
          <h2 className="appointments-title">Upcoming Appointments</h2>
          {appointments.length > 0 && (
            <button className="view-all-button">
              View All
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="no-appointments-text">You don't have any upcoming appointments.</p>
            <button className="find-opportunities-button">
              Find Volunteer Opportunities
            </button>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-date-container">
                  <div className="appointment-date">
                    {formatDate(appointment.date)}
                  </div>
                  <div className="appointment-time">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </div>
                </div>
                
                <div className="appointment-details">
                  <h3 className="appointment-title">{appointment.title || 'Volunteer Session'}</h3>
                  
                  {appointment.location && (
                    <div className="appointment-location">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                  
                  {appointment.supervisor && (
                    <div className="appointment-supervisor">
                      <UserCircle className="w-4 h-4" />
                      <span>Supervisor: {appointment.supervisor}</span>
                    </div>
                  )}
                </div>
                
                <div className="appointment-actions">
                  <button className="appointment-details-button">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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