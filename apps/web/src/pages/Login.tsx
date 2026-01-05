import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Map email domains to SAML connections
  const samlDomains: Record<string, string> = {
    'stanford.edu': 'Stanford-saml',
    // Add more universities as they're configured
    // 'berkeley.edu': 'Berkeley-saml',
  };

  const getUniversityFromEmail = (email: string): string | null => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    // Check for SAML-enabled domains
    if (samlDomains[domain]) {
      return domain;
    }

    // Check for .edu domains (other universities)
    if (domain.endsWith('.edu')) {
      return domain;
    }

    return null;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email');
      return;
    }

    const university = getUniversityFromEmail(trimmedEmail);
    if (!university) {
      setError('Please use a valid university email (.edu)');
      return;
    }

    // Store email in both sessionStorage and localStorage for use after SAML callback
    // localStorage persists longer in case sessionStorage is cleared
    sessionStorage.setItem('pending_auth_email', trimmedEmail);
    localStorage.setItem('pending_auth_email', trimmedEmail);

    const domain = trimmedEmail.split('@')[1];
    const samlConnection = samlDomains[domain];

    if (samlConnection) {
      // Use SAML for configured universities (Stanford, etc.)
      loginWithRedirect({
        authorizationParams: {
          connection: samlConnection,
          redirect_uri: window.location.origin + '/callback',
          login_hint: trimmedEmail,
        }
      }).catch(err => {
        console.error('SAML login error:', err);
        setError('Login failed. Please try again.');
      });
    } else {
      // Use Auth0 Universal Login for other .edu emails
      loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/callback',
          login_hint: trimmedEmail,
        }
      }).catch(err => {
        console.error('Login error:', err);
        setError('Login failed. Please try again.');
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to ThreadLoop</h1>
          <p className="login-subtitle">Sign in with your university email</p>
        </div>

        <div className="login-form">
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

          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@university.edu"
              className="login-input"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <p style={{ color: '#d7263d', fontSize: '14px', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Continue'}
            </button>
          </form>

          <p className="login-footer">
            By signing in, you agree to our Terms of Service and verify you are a current student.
          </p>
        </div>

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
