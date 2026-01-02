import { useAuth0 } from '@auth0/auth0-react';

export function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleStanfordLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'stanford-saml',
        redirect_uri: window.location.origin + '/callback',
      }
    });
  };

  const handleUniversalLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
      }
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to ThreadLoop</h1>
          <p className="login-subtitle">Sign in with your university credentials</p>
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

          <button
            onClick={handleStanfordLogin}
            className="login-button"
            disabled={isLoading}
            style={{ marginBottom: '12px' }}
          >
            {isLoading ? 'Loading...' : 'Sign in with Stanford'}
          </button>

          <button
            onClick={handleUniversalLogin}
            className="login-button"
            disabled={isLoading}
            style={{
              background: 'white',
              color: '#5d3bff',
              border: '2px solid #5d3bff'
            }}
          >
            {isLoading ? 'Loading...' : 'Sign in with Other University'}
          </button>

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
