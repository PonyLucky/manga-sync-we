import { Link, useLocation } from 'react-router-dom';
import { Library, Settings } from 'lucide-react';
import './Header.scss';

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo">
          <span className="header__logo-text">Manga Sync</span>
        </Link>

        <nav className="header__nav">
          <Link
            to="/"
            className={`header__nav-link ${location.pathname === '/' ? 'header__nav-link--active' : ''}`}
          >
            <Library size={20} />
            <span>Library</span>
          </Link>
          <Link
            to="/settings"
            className={`header__nav-link ${location.pathname === '/settings' ? 'header__nav-link--active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
