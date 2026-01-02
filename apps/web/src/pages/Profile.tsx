import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const BADGE_INFO: Record<string, { label: string; icon: string; description: string }> = {
  'verified-student': {
    label: 'Verified Student',
    icon: '✓',
    description: 'University email verified'
  },
  'reliable-swapper': {
    label: 'Reliable Swapper',
    icon: '🤝',
    description: '10+ successful swaps'
  },
  'quick-responder': {
    label: 'Quick Responder',
    icon: '⚡',
    description: 'Avg response < 2 hours'
  },
  'campus-og': {
    label: 'Campus OG',
    icon: '👑',
    description: 'Active for 1+ year'
  },
  'top-seller': {
    label: 'Top Seller',
    icon: '⭐',
    description: '50+ successful sales'
  },
  'sustainability-champion': {
    label: 'Sustainability Champion',
    icon: '🌱',
    description: '100+ items swapped'
  }
};

export function Profile() {
  const { user, campus, logout, isLoading } = useAuth();
  const { logout: auth0Logout } = useAuth0();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p>Please log in to view your profile</p>
          <button className="cta-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const campusName = campus?.name ?? 'Your campus';

  const handleLogout = async () => {
    await logout();
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin + '/login'
      }
    });
  };

  return (
    <div className="page-content">
      <section>
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-hero">
            <div className="profile-avatar-large">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <span>{user.displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="profile-header-info">
              <h1>{user.displayName}</h1>
              <p className="profile-campus">{campusName}</p>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="stat-box">
              <div className="stat-value">{user.rating.toFixed(1)}</div>
              <div className="stat-label">⭐ Rating</div>
              <div className="stat-sublabel">{user.totalRatings} reviews</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user.swapCount}</div>
              <div className="stat-label">Total Swaps</div>
              <div className="stat-sublabel">{user.successfulSwaps} completed</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{user.swapStreak}</div>
              <div className="stat-label">🔥 Swap Streak</div>
              <div className="stat-sublabel">consecutive days</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{Math.round(user.averageResponseTime / 60) || 'N/A'}</div>
              <div className="stat-label">⏱️ Response Time</div>
              <div className="stat-sublabel">{user.averageResponseTime ? 'hours avg' : 'no data yet'}</div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="profile-section">
            <h2>Trust Badges</h2>
            <div className="badges-grid">
              {user.badges.map(badge => {
                const info = BADGE_INFO[badge];
                return (
                  <div key={badge} className="badge-card">
                    <span className="badge-icon">{info.icon}</span>
                    <div className="badge-info">
                      <span className="badge-label">{info.label}</span>
                      <span className="badge-description">{info.description}</span>
                    </div>
                  </div>
                );
              })}
              {user.badges.length === 0 && (
                <p className="empty-state-small">Complete more swaps to earn badges!</p>
              )}
            </div>
          </div>

          {/* Style Profile */}
          <div className="profile-section">
            <h2>Style Profile</h2>
            {user.styleVibes && user.styleVibes.length > 0 ? (
              <div className="style-profile-content">
                <div className="style-vibes">
                  <strong>My Vibes:</strong>
                  <div className="tags-container">
                    {user.styleVibes.map(vibe => (
                      <span key={vibe} className="pill">{vibe}</span>
                    ))}
                  </div>
                </div>

                {user.favoriteColors && user.favoriteColors.length > 0 && (
                  <div className="favorite-colors">
                    <strong>Favorite Colors:</strong>
                    <div className="tags-container">
                      {user.favoriteColors.map(color => (
                        <span key={color} className="pill pill-secondary">{color}</span>
                      ))}
                    </div>
                  </div>
                )}

                {user.sizingProfile && Object.values(user.sizingProfile).some(v => v) && (
                  <div className="sizing-info">
                    <strong>My Sizes:</strong>
                    <div className="sizing-grid">
                      {user.sizingProfile.topSize && (
                        <span>Top: {user.sizingProfile.topSize}</span>
                      )}
                      {user.sizingProfile.bottomSize && (
                        <span>Bottom: {user.sizingProfile.bottomSize}</span>
                      )}
                      {user.sizingProfile.shoeSize && (
                        <span>Shoe: {user.sizingProfile.shoeSize}</span>
                      )}
                      {user.sizingProfile.dressSize && (
                        <span>Dress: {user.sizingProfile.dressSize}</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className="ghost"
                  onClick={() => navigate('/style-quiz')}
                >
                  Edit Style Profile
                </button>
              </div>
            ) : (
              <div className="empty-state-small">
                <p>Complete your style profile to get personalized recommendations!</p>
                <button
                  className="cta-primary"
                  onClick={() => navigate('/style-quiz')}
                >
                  Take Style Quiz
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="profile-section">
              <h2>About Me</h2>
              <p className="profile-bio">{user.bio}</p>
            </div>
          )}

          {/* Actions */}
          <div className="profile-actions">
            <button className="cta-primary" onClick={() => navigate('/account')}>
              Add / Change Profile Photo
            </button>
            <button className="ghost" onClick={() => navigate('/account')}>
              Edit Profile Settings
            </button>
            <button className="ghost logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
