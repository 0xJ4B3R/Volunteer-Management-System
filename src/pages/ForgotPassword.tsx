import React, { useState } from 'react';

export default function ForgotPassword() {
  const [input, setInput] = useState('');

  function handleReset() {
    alert("Works");
  }

  return (
    <div 
    className="flex justify-center items-center min-h-screen p-4 bg-amber-50"
    style={{
          backgroundImage: 'url("/Background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
    }}
    >
      <div 
      className="bg-amber-50/80 p-6 rounded-lg shadow-lg w-full max-w-md"
      style={{
          backgroundImage: 'url("Card.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
      }}
      >
        <h1 className="text-2xl font-semibold text-gray-700 mb-4">Reset your password</h1>
        <p className="text-gray-600 mb-6">
          Enter the phone number associated with your account and we'll send you a one time code to confirm your identity
        </p>
        
        <div className="mt-8 mb-6">
          <input
            className="w-full p-4 bg-amber-50 border border-amber-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700/30"
            type="text"
            placeholder="Phone number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        
        <button
          className="w-full py-3 bg-green-800 text-white font-semibold rounded hover:bg-green-700 active:translate-y-px transition-all"
          onClick={handleReset}
        >
          Send Code
        </button>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-green-800 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}