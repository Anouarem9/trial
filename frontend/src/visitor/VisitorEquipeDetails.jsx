import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EquipeAPI, JoueurAPI } from '../api.js';
import TeamLogo from '../components/TeamLogo.jsx';
import PlayerCard from '../components/PlayerCard.jsx';
import { VizCard, DonutChart, BarChart, StatRing } from '../components/Charts.jsx';
import { Reveal } from '../anim.jsx';
import { POSTE_FULL } from '../utils.js';

export default function VisitorEquipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipe, setEquipe] = useState(null);
  const [joueurs, setJoueurs] = useState([]);
  const [participations, setParticipations] = useState([]);

  useEffect(() => {
    Promise.all([
      EquipeAPI.get(id),
      JoueurAPI.list(id),
      EquipeAPI.participations(id).catch(() => [])
    ]).then(([e, j, p]) => { setEquipe(e); setJoueurs(j); setParticipations(p); });
  }, [id]);

  if (!equipe) return <div className="v-container"><div className="empty">Chargement…</div></div>;

  const posteColors = { GARDIEN: '#fbbf24', DEFENSEUR: '#34d399', MILIEU: '#a78bfa', ATTAQUANT: '#38bdf8' };
  const posteData = Object.keys(POSTE_FULL).map(p => ({
    label: POSTE_FULL[p],
    value: joueurs.filter(j => j.poste === p).length,
    color: posteColors[p],
  })).filter(d => d.value > 0);

  const topScorers = [...joueurs]
    .sort((a, b) => (b.buts ?? 0) - (a.buts ?? 0))
    .slice(0, 6)
    .map(j => ({ label: j.nom, value: j.buts ?? 0 }));

  const totalButs = joueurs.reduce((s, j) => s + (j.buts ?? 0), 0);
  const totalPasses = joueurs.reduce((s, j) => s + (j.passesDecisives ?? 0), 0);

  return (
    <div className="v-container" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <Link to="/equipes" style={{ color: 'var(--muted)', fontSize: 13 }}>← Toutes les équipes</Link>
        <div className="team-banner" style={{ marginTop: 12 }}>
          <div className="team-logo">
            <TeamLogo equipe={equipe} size={100} />
          </div>
          <div style={{ flex: 1 }}>
            <h2>{equipe.nom}</h2>
            <div className="meta">{equipe.ville || 'Ville non précisée'} · Entraîneur : {equipe.entraineur || '—'}</div>
            <div className="meta">{joueurs.length} joueur{joueurs.length > 1 ? 's' : ''} dans l'effectif</div>
            {participations.length > 0 && (
              <div className="meta" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span>Participations :</span>
                {participations.map(t => (
                  <Link to={`/tournois/${t.id}`} key={t.id}>
                    <span className={`badge badge-${t.statut}`}>{t.nom}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {joueurs.length > 0 && (
          <>
            <div className="eyebrow">Squad Analytics</div>
            <Reveal className="viz-grid" stagger={0.1}>
              <VizCard title="Composition par" highlight="poste" tag={`${joueurs.length} joueurs`}>
                <DonutChart data={posteData} />
              </VizCard>
              <VizCard title="Meilleurs" highlight="buteurs" tag="buts">
                <BarChart data={topScorers} />
              </VizCard>
              <VizCard title="Contribution" highlight="offensive" tag="total">
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <StatRing value={totalButs} max={Math.max(20, totalButs)} size={96} caption="buts" />
                  <StatRing value={totalPasses} max={Math.max(20, totalPasses)} size={96} caption="passes" />
                </div>
              </VizCard>
            </Reveal>
          </>
        )}

        <h3 style={{ marginBottom: 16 }}>Effectif</h3>
        {joueurs.length === 0 ? (
          <div className="empty">Aucun joueur dans cette équipe.</div>
        ) : (
          <div className="player-grid">
            {joueurs
              .sort((a, b) => (b.buts ?? 0) - (a.buts ?? 0))
              .map(j => (
                <PlayerCard key={j.id} joueur={j} onClick={() => navigate(`/joueurs/${j.id}`)} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
