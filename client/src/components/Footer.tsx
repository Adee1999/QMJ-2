import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <GraduationCap size={18} aria-hidden="true" />
          ҚМЖ Генератор
        </div>
        <nav className="footer-links" aria-label="Төменгі навигация">
          <Link to="/terms">Қолданушы келісімі</Link>
          <span className="footer-dot" aria-hidden="true">·</span>
          <Link to="/privacy">Құпиялылық саясаты</Link>
        </nav>
        <p className="footer-copy">© {new Date().getFullYear()} seriktesbol.com жобасы</p>
      </div>
    </footer>
  );
}
