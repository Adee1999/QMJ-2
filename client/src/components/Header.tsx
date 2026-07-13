import { NavLink, Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, GraduationCap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/', label: 'Генератор', end: true },
  { to: '/terms', label: 'Қолданушы келісімі', end: false },
  { to: '/privacy', label: 'Құпиялылық саясаты', end: false },
];

interface Props {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export default function Header({ menuOpen, onToggleMenu }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="appbar">
      <div className="container appbar-inner">
        <Link to="/" className="appbar-brand" aria-label="ҚМЖ Генератор — басты бет">
          <span className="appbar-brand-mark" aria-hidden="true">
            <GraduationCap />
          </span>
          <span className="appbar-brand-name">ҚМЖ Генератор</span>
        </Link>

        <nav className="appbar-nav" aria-label="Негізгі навигация">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="nav-link"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="appbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Қараңғы темаға ауысу' : 'Ашық темаға ауысу'}
            title={theme === 'light' ? 'Қараңғы тема' : 'Ашық тема'}
          >
            <Sun className="theme-icon icon-sun" size={20} aria-hidden="true" />
            <Moon className="theme-icon icon-moon" size={20} aria-hidden="true" />
          </button>

          <button
            className="appbar-menu-btn"
            onClick={onToggleMenu}
            aria-label={menuOpen ? 'Мәзірді жабу' : 'Мәзірді ашу'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        <div className="container">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="nav-link"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
