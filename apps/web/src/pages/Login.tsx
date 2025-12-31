import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email);

    if (result.success) {
      return;
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to ThreadLoop</h1>
          <p className="login-subtitle">Sign in with your university email to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Campus-verified students only</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Safe, local meetups on campus</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>AI-powered listings in seconds</span>
            </div>
          </div>

          <label className="field">
            <span>University Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@stanford.edu"
              required
              disabled={loading}
            />
            <small className="hint">
              Use your .edu email address (Stanford, UC Berkeley, MIT supported)
            </small>
          </label>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="cta-primary login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with University Email'}
          </button>

          <p className="login-footer">
            By signing in, you agree to our Terms of Service and verify you are a current student.
          </p>
        </form>

        <div className="supported-universities">
          <p className="supported-title">Supported Universities:</p>
          <div className="university-badges">
            <span className="university-badge">Stanford</span>
            <span className="university-badge">UC Berkeley</span>
            <span className="university-badge">MIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
