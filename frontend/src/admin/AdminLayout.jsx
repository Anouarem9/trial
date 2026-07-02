import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>⚽ Score<b>Cup</b></h1>
        <nav>
          <NavLink to="/admin" end>Tableau de bord</NavLink>
          <NavLink to="/admin/tournois">Tournois</NavLink>
          <NavLink to="/admin/equipes">Équipes</NavLink>
          <NavLink to="/admin/joueurs">Joueurs</NavLink>
          <NavLink to="/" style={{ marginTop: 16, color: 'var(--muted)' }}>← Vue publique</NavLink>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 32, fontSize: 12, color: 'var(--muted)' }}>
          <div>Connecté en tant que</div>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>{user?.username}</div>
          <button className="btn btn-sm" onClick={doLogout} style={{ width: '100%' }}>Déconnexion</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
