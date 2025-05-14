import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import {collection, getDocs, query, where} from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill all the fields above");
      return;
    }
  
    try {
      console.log("Attempting login for username:", username);
      const userCollection = collection(db, "Users");
      const q = query(userCollection, where("username", "==", username));
      const querySnapShot = await getDocs(q);
  
      if (querySnapShot.empty) {
        console.log("User not found in database");
        setError("User not found");
        return;
      }
  
      const userDoc = querySnapShot.docs[0];
      const userData = userDoc.data();
      const role = userData.role;
      
      console.log("User found with role:", role);
  
      // Save user data to localStorage
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userDoc.id);
      localStorage.setItem("username", username); // This is critical - store the username
      localStorage.setItem("user", JSON.stringify({
        id: userDoc.id,
        username: userData.username,
        role: userData.role,
        // Add other non-sensitive user data you might need
      }));
  
      if (userData.password === password) {
        console.log("Password matches, navigating to:", role === 'manager' ? '/manager' : '/volunteer');
        
        // Slight delay to ensure localStorage is set before navigation
        setTimeout(() => {
          if (role === 'volunteer') {
            navigate('/volunteer');
          }
          else if (role === 'manager') {
            navigate('/manager');
          }
          else {
            console.log("Invalid role detected:", role);
            setError("Invalid user role");
          }
        }, 100);
      } else {
        console.log("Password mismatch");
        setError("Wrong password or username");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Couldn't login");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side with logo - preserved exactly as in original */}
        <div className="login-logo-section">
          <img
            src="./public/newLogo.png"
            alt="Login Logo"
            className="login-logo"
          />
        </div>

        {/* Right side with login form */}
        <div className="login-form-section">
          <h1 className="login-title">Login!</h1>
          <p className="login-subtitle">Welcome! So good to have you back!</p>

          <div className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            <button 
              className="login-button"
              onClick={handleLogin}
            >
              Log in
            </button>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <a href="/forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}