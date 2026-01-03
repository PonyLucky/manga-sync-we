import { Link, useLocation } from 'react-router-dom';
import { Library, Settings, Plus } from 'lucide-react';
import { Button } from '../Button/Button';
import './Header.scss';

interface HeaderProps {
  onAddManga?: () => void;
}

export function Header({ onAddManga }: HeaderProps) {
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

        <div className="header__actions">
          {onAddManga && (
            <Button variant="primary" size="sm" onClick={onAddManga}>
              <Plus size={18} />
              <span>Add Manga</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
