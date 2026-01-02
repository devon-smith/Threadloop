import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export function Callback() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Check if user has completed style quiz
        const hasCompletedQuiz = localStorage.getItem('completed_style_quiz');
        navigate(hasCompletedQuiz ? '/' : '/style-quiz');
      } else if (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    }
  }, [isLoading, isAuthenticated, error, navigate]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f6ff 0%, #fff4f9 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Completing sign in...</h2>
          <p style={{ color: '#6b6b6b' }}>Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f6ff 0%, #fff4f9 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#d7263d' }}>Authentication Error</h2>
          <p>{error.message}</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#5d3bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
