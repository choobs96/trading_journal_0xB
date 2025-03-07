import React, { useState } from 'react';
import axios from 'axios';

export default function LoginPage({ onLoginClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Close the login modal when clicking outside the login container
  function handleOverlayClick(event) {
    if (event.target.classList.contains('login-overlay')) {
      onLoginClose();
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', { email, password });

      if (response.data.token) {
        console.log('Logged in successfully');
        localStorage.setItem('authToken', response.data.token); // Store token in localStorage
        onLogin(); // Notify parent component about successful login
        // onLoginClose(); // Close the login form after successful login
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Error during login', error);
      setError('An error occurred during login');
    }
  };

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-container">
        <div className="login-header">
          <h1>Login</h1>
          <button className="close-btn" onClick={onLoginClose}>
            X
          </button>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
