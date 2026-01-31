import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Trim whitespace and normalize
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (trimmedUsername === 'LPL_Success' && trimmedPassword === 'Heritage2026') {
      setLoading(true);
      // Simulate loading animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      onLogin();
    } else {
      setError('Invalid credentials. Please use: LPL_Success / Heritage2026');
    }
  };

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">LPL</div>
          </div>
          <h1 className="login-title">Heritage Hub</h1>
          <p className="login-subtitle">Secure Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="login-error"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="login-loading">
                <span className="spinner"></span>
                Loading your Secure Heritage Hub...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-demo-hint">
            Demo Credentials: <strong>LPL_Success</strong> / <strong>Heritage2026</strong>
          </p>
        </div>
      </motion.div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #002D72 0%, #003A8A 100%);
          padding: 2rem;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 3rem;
          width: 100%;
          max-width: 420px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          background: linear-gradient(135deg, #002D72 0%, #287E33 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          color: #002D72;
          margin: 0 0 0.5rem 0;
        }

        .login-subtitle {
          color: #666;
          font-size: 0.9375rem;
          margin: 0;
        }

        .login-form {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #002D72;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #002D72;
        }

        .login-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #002D72 0%, #003A8A 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 45, 114, 0.3);
        }

        .login-button:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .login-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-error {
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          border: 1px solid #fecaca;
        }

        .login-footer {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .login-demo-hint {
          font-size: 0.8125rem;
          color: #666;
          margin: 0;
        }

        .login-demo-hint strong {
          color: #002D72;
        }
      `}</style>
    </div>
  );
}

export default Login;
