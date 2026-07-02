import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Reveal, useMagnetic } from '../anim.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submitRef = useMagnetic(0.3);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(username, password);
      const from = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin';
      navigate(from, { replace: true });
    } catch (e) {
      setErr('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <Reveal as="form" onSubmit={submit} className="card login-card">
        <div className="eyebrow">Admin Access</div>
        <h2>⚽ Score<b>Cup</b></h2>
        <p style={{ color: 'var(--muted)', marginTop: 0, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Connectez-vous pour accéder au tableau de bord</p>
        {err && <div className="error">{err}</div>}
        <div className="form-group">
          <label>Utilisateur</label>
          <input value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
        </div>
        <div className="form-group">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button ref={submitRef} className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>
          ← Retour à la vue publique
        </Link>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          <div><strong>Comptes de démo :</strong></div>
          <div>• admin / admin123 (administrateur)</div>
          <div>• organisateur / organisateur123 (organisateur)</div>
        </div>
      </Reveal>
    </div>
  );
}
