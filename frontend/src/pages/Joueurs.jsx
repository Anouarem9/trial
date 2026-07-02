import { useEffect, useState } from 'react';
import { JoueurAPI, EquipeAPI } from '../api.js';
import { Link } from 'react-router-dom';

export default function Joueurs() {
  const [items, setItems] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([JoueurAPI.list(), EquipeAPI.list()])
      .then(([j, e]) => { setItems(j); setEquipes(e); })
      .catch(e => setErr(e.message));
  }, []);

  const equipeNom = (j) => {
    if (j.equipe) return j.equipe.nom;
    return equipes.find(e => e.id === j.equipeId)?.nom || '—';
  };

  const filtered = items.filter(j => {
    const s = `${j.nom} ${j.prenom}`.toLowerCase();
    return s.includes(filter.toLowerCase());
  });

  return (
    <>
      <div className="page-header">
        <h2>Joueurs</h2>
        <input style={{ maxWidth: 280 }} placeholder="Rechercher…"
               value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      {err && <div className="error">{err}</div>}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">Aucun joueur. Ajoutez-en depuis la page d'une équipe.</div>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Nom</th><th>Prénom</th><th>Poste</th><th>Équipe</th></tr></thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td>{j.numero ?? '—'}</td>
                  <td>{j.nom}</td>
                  <td>{j.prenom}</td>
                  <td>{j.poste || '—'}</td>
                  <td>{j.equipe ? <Link to={`/admin/equipes/${j.equipe.id}`}>{j.equipe.nom}</Link> : equipeNom(j)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
