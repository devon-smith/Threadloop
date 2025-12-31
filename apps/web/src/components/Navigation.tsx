import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          ThreadLoop
        </Link>
        <ul className="nav-menu">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/browse" className={isActive('/browse') ? 'active' : ''}>
              Browse
            </Link>
          </li>
          <li>
            <Link to="/closet" className={isActive('/closet') ? 'active' : ''}>
              My Closet
            </Link>
          </li>
          <li>
            <Link to="/bulk-upload" className={isActive('/bulk-upload') ? 'active' : ''}>
              Bulk Upload
            </Link>
          </li>
          <li>
            <Link to="/account" className={isActive('/account') ? 'active' : ''}>
              Account
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
                  Profile
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className={isActive('/logout') ? 'active' : ''}
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className={isActive('/login') ? 'active' : ''}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
