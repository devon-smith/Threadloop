import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={handleNavClick}>
          ThreadLoop
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
              onClick={handleNavClick}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/browse"
              className={isActive('/browse') ? 'active' : ''}
              onClick={handleNavClick}
            >
              Browse
            </Link>
          </li>
          <li>
            <Link
              to="/closet"
              className={isActive('/closet') ? 'active' : ''}
              onClick={handleNavClick}
            >
              My Closet
            </Link>
          </li>
          <li>
            <Link
              to="/messages"
              className={isActive('/messages') ? 'active' : ''}
              onClick={handleNavClick}
            >
              Messages
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link
                  to="/profile"
                  className={isActive('/profile') ? 'active' : ''}
                  onClick={handleNavClick}
                >
                  Profile
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="nav-logout"
                  onClick={async () => {
                    await logout();
                    setMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                className={`nav-login ${isActive('/login') ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
