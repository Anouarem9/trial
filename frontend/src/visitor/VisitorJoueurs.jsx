import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoueurAPI } from '../api.js';
import PlayerCard from '../components/PlayerCard.jsx';
import { LeaderboardCard } from '../components/Leaderboard.jsx';
import { POSTE_FULL } from '../utils.js';

const POSTES = ['', 'GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT'];
const POSTE_LABEL = { '': 'Tous postes', GARDIEN: 'Gardiens', DEFENSEUR: 'Défenseurs', MILIEU: 'Milieux', ATTAQUANT: 'Attaquants' };

const RUN_OPTIONS = [
  { id: 'buts', label: 'Buts marqués' },
  { id: 'passes', label: 'Passes décisives' },
];
const metricValue = (j, id) =>
  id === 'passes' ? (j.passesDecisives ?? 0) : (j.buts ?? 0);

export default function VisitorJoueurs() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [poste, setPoste] = useState('');
  const [metric, setMetric] = useState('buts');
  const navigate = useNavigate();

  useEffect(() => { JoueurAPI.list().then(setItems); }, []);

  const filtered = items
    .filter(j => !poste || j.poste === poste)
    .filter(j => `${j.prenom} ${j.nom}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.buts ?? 0) - (a.buts ?? 0));

  // Build leaderboard data from real players, ranked by the selected metric.
  const ranked = useMemo(() => {
    const sorted = [...items]
      .sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
      .map((j, i) => ({
        userId: String(j.id),
        rank: i + 1,
        userName: `${j.prenom} ${j.nom}`,
        byline: `${POSTE_FULL[j.poste] || '—'} · ${j.equipe?.nom || 'Sans équipe'}`,
        value: metricValue(j, metric),
        photoUrl: j.photoUrl,
        displayed: true,
      }));
    return sorted;
  }, [items, metric]);

  const podiumRankings = ranked.slice(0, 3);

  return (
    <div className="v-container" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <h1 className="v-page-title">Joueurs</h1>

        {ranked.length >= 3 && (
          <LeaderboardCard
            title="Classement des joueurs"
            fromDate={`${new Date().getFullYear()}-01-01`}
            toDate={new Date()}
            podiumRankings={podiumRankings}
            rankings={ranked}
            runOptions={RUN_OPTIONS}
            selectedRunId={metric}
            onRunChange={setMetric}
            style={{ marginBottom: 28 }}
          />
        )}

        <h3 style={{ margin: '8px 0 12px' }}>Tous les joueurs</h3>
        <div className="row" style={{ marginBottom: 16 }}>
          <input placeholder="Rechercher un joueur…" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={poste} onChange={e => setPoste(e.target.value)} style={{ maxWidth: 200 }}>
            {POSTES.map(p => <option key={p} value={p}>{POSTE_LABEL[p]}</option>)}
          </select>
        </div>
        <div className="v-page-sub">{filtered.length} joueur{filtered.length > 1 ? 's' : ''} · triés par buts marqués</div>
        {filtered.length === 0 ? (
          <div className="empty">Aucun joueur ne correspond.</div>
        ) : (
          <div className="player-grid">
            {filtered.map(j => (
              <PlayerCard key={j.id} joueur={j} onClick={() => navigate(`/joueurs/${j.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
