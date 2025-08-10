import React, { useState } from 'react';
import axios from 'axios';
import config from '../config.js';

export default function LoginPage({ onLoginClose, onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login & register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Close the login modal when clicking outside the container
  function handleOverlayClick(event) {
    if (event.target.classList.contains('login-overlay')) {
      onLoginClose();
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        // ✅ Registration logic
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const response = await axios.post(`${config.api.baseURL}/api/register`, {
          name,
          email,
          password,
        });

        if (response.data.success) {
          alert('Registration successful! You can now log in.');
          setIsRegistering(false); // Switch back to login mode
        } else {
          setError(response.data.message || 'Registration failed');
        }
      } else {
        // ✅ Login logic
        console.log('🔍 Attempting login with:', { email, password });
        console.log('🔍 API URL:', `${config.api.baseURL}/api/login`);
        
        const response = await axios.post(`${config.api.baseURL}/api/login`, { email, password });
        
        console.log('🔍 Login response:', response.data);

        if (response.data.token) {
          console.log('✅ Logged in successfully');
          localStorage.setItem('auth_token', response.data.token);
          onLogin(response);
        } else {
          setError('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      });
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-container">
        <div className="login-header">
          <h1>{isRegistering ? 'Register' : 'Login'}</h1>
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
          {isRegistering && (
            <div>
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          {error && <p className="login-error">{error}</p>}
        </form>

        <p className="toggle-link">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
