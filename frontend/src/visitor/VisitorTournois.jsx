import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TournoiAPI } from '../api.js';

export default function VisitorTournois() {
  const [items, setItems] = useState([]);

  useEffect(() => { TournoiAPI.list().then(setItems); }, []);

  return (
    <div className="v-container" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <h1 className="v-page-title">Tournois</h1>
        <div className="v-tournament-block">
          {items.map(t => (
            <Link to={`/tournois/${t.id}`} key={t.id}>
              <div className="v-tournament-item" style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
                <div className="v-icon" style={{ width: 40, height: 40 }}>{t.nom[0]}</div>
                <div className="v-meta">
                  <div className="v-title" style={{ fontSize: 15 }}>{t.nom}</div>
                  <div className="v-sub">{t.lieu || 'Lieu non précisé'} · {t.dateDebut}</div>
                </div>
                <span className={`badge badge-${t.statut}`}>{t.statut.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
