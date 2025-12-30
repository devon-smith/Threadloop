import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './styles.css';

function App() {
  return (
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
            <Route path="/style-quiz" element={<StyleQuiz />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
