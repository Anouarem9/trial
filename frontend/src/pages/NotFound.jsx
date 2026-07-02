import { Link, useNavigate } from 'react-router-dom';
import { Reveal, useMagnetic } from '../anim.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  const homeRef = useMagnetic(0.35);

  return (
    <div className="nf-shell">
      <Reveal className="nf-inner" stagger={0.12}>
        <div className="eyebrow">Erreur 404</div>
        <div className="nf-code">404</div>
        <h1 className="nf-title">Hors-jeu.</h1>
        <p className="nf-text">
          La page que vous cherchez a quitté le terrain. Le lien est peut-être
          rompu, ou le match n'a jamais été programmé.
        </p>
        <div className="nf-actions">
          <button ref={homeRef} className="btn btn-primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
          <Link to="/tournois" className="btn">Voir les tournois</Link>
        </div>
      </Reveal>
      <div className="nf-ball" aria-hidden>⚽</div>
    </div>
  );
}
