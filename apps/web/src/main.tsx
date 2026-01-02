import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { Closet } from './pages/Closet';
import { Account } from './pages/Account';
import { BulkUpload } from './pages/BulkUpload';
import { Login } from './pages/Login';
import { StyleQuiz } from './pages/StyleQuiz';
import { Profile } from './pages/Profile';
import { Callback } from './pages/Callback';
import './styles.css';

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || 'dev-voe0iav0bx1n8qkd.us.auth0.com'}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || 'ec2LAdO4LsXxvGV0cefThYKCIizeS512'}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin + '/callback' : '',
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <div className="app">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/closet" element={<Closet />} />
              <Route path="/bulk-upload" element={<BulkUpload />} />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/style-quiz" element={<StyleQuiz />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </Auth0Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
