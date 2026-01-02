import { useAuth0 } from '@auth0/auth0-react';

export function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleStanfordLogin = () => {
    // Direct URL construction to bypass Universal Login and go straight to SAML
    const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-voe0iav0bx1n8qkd.us.auth0.com';
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'ec2LAdO4LsXxvGV0cefThYKCIizeS512';
    const redirectUri = window.location.origin + '/callback';
    const connection = 'Stanford-saml';

    const authUrl = `https://${domain}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `connection=${connection}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid%20profile%20email`;

    console.log('Redirecting to SAML:', authUrl);
    window.location.href = authUrl;
  };

  const handleUniversalLogin = () => {
    console.log('Attempting Universal Login...');
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
      }
    }).catch(err => {
      console.error('Universal login error:', err);
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
            onClick={handleUniversalLogin}
            className="login-button"
            disabled={isLoading}
            style={{ marginBottom: '12px' }}
          >
            {isLoading ? 'Loading...' : 'Sign in with University Email'}
          </button>

          <button
            onClick={handleStanfordLogin}
            className="login-button"
            disabled={isLoading}
            style={{
              background: 'white',
              color: '#5d3bff',
              border: '2px solid #5d3bff'
            }}
          >
            {isLoading ? 'Loading...' : 'Sign in with Stanford SAML (Debug)'}
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
