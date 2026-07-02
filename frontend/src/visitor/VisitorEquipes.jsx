import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EquipeAPI } from '../api.js';
import TeamLogo from '../components/TeamLogo.jsx';

export default function VisitorEquipes() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { EquipeAPI.list().then(setItems); }, []);

  const filtered = items.filter(e => e.nom.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="v-container" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <h1 className="v-page-title">Équipes</h1>
        <input style={{ maxWidth: 320, marginBottom: 20 }} placeholder="Rechercher une équipe…"
               value={filter} onChange={e => setFilter(e.target.value)} />
        <div className="team-grid">
          {filtered.map(e => (
            <Link to={`/equipes/${e.id}`} key={e.id}>
              <div className="team-card">
                <div className="logo">
                  <TeamLogo equipe={e} size={64} />
                </div>
                <div className="name">{e.nom}</div>
                <div className="city">{e.ville || '—'}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
