import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import {collection, getDocs, query, where} from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

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
    <div 
    className="flex justify-center items-center min-h-screen p-5 font-sans text-gray-700 leading-normal"
    style={{
          backgroundImage: 'url("/Background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
    }}
    >
      <div className="flex flex-row w-full max-w-4xl h-[550px] rounded-2xl shadow-lg overflow-hidden bg-amber-50">
        {/* Left side with logo - preserved exactly as in original */}
        <div 
        className="flex-1 bg-amber-100 flex justify-center items-center"
        style={{ backgroundColor: '#f6ead1'}}
        >
          <img
            src="./public/newLogo.png"
            alt="Login Logo"
            className="w-full h-auto transition-all duration-300 ease-in-out"
          />
        </div>

        {/* Right side with login form */}
        <div 
        className="flex-1 px-8 py-10 flex flex-col justify-center bg-amber-50"
        style={{
          backgroundImage: 'url("Card.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        >
          <h1 className="text-3xl font-bold text-gray-700 text-center mb-2">Login!</h1>
          <p className="text-lg text-gray-700 text-center mb-4">Welcome! So good to have you back!</p>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <label className="mb-1 text-base font-medium text-gray-700" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-3.5 border border-amber-50 rounded-lg bg-amber-50/80 text-gray-800 text-base transition-all duration-300"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-base font-medium text-gray-700" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3.5 border border-amber-50 rounded-lg bg-amber-50/80 text-gray-800 text-base transition-all duration-300"
              />
            </div>

            <button 
              className="w-full py-3.5 bg-green-800 text-white text-lg font-semibold border-none rounded-lg cursor-pointer mt-2 transition-all duration-200 hover:bg-green-700 active:translate-y-px"
              onClick={handleLogin}
            >
              Log in
            </button>

            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
            )}

            <a href="/forgot-password" className="mt-2 text-center text-base text-green-800 no-underline transition-colors duration-200 hover:text-green-700">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}