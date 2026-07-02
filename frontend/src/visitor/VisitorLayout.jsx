import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMagnetic } from '../anim.jsx';

export default function VisitorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ctaRef = useMagnetic(0.4);

  const onLoginClick = async () => {
    if (user) await logout();
    navigate('/login');
  };

  return (
    <div className="v-app">
      <header className="v-header">
        <div className="v-header-inner">
          <div className="v-logo">⚽ Score<b>Cup</b></div>
          <nav className="v-nav">
            <NavLink to="/" end>Matches</NavLink>
            <NavLink to="/tournois">Tournois</NavLink>
            <NavLink to="/equipes">Équipes</NavLink>
            <NavLink to="/joueurs">Joueurs</NavLink>
          </nav>
          {user
            ? <button ref={ctaRef} className="v-login-btn" onClick={() => navigate('/admin')}>Dashboard</button>
            : <button ref={ctaRef} className="v-login-btn" onClick={onLoginClick}>Connexion</button>}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
