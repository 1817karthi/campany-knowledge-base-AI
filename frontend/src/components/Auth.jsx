import { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function Auth({ onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!isLogin) {
      if (!username) {
        setError('Please choose a username.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await loginUser({ email, password });
        addToast('Welcome back!', 'success');
        onAuthSuccess(res.data.user, res.data.token);
      } else {
        const res = await registerUser({ username, email, password });
        addToast('Registration successful! Welcome!', 'success');
        onAuthSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please try again.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background blobs are rendered inside App layout or auth-container */}
      <div className="auth-card">
        <div className="auth-header-logo">
          <span>🏢</span>
          <span className="auth-logo-lock">🔒</span>
        </div>
        <h2 className="auth-title">Company Knowledge Base</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access documents and ask the AI HR Assistant'
            : 'Register your account to access company files'}
        </p>

        {error && <div className="auth-error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-field-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-field-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-field-wrapper">
              <span className="input-icon">🔑</span>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-field-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading} id="auth-submit-button">
            {loading ? (
              <span className="auth-spinner"></span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                id="toggle-signup"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                id="toggle-login"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
