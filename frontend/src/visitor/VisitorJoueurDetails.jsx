import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { JoueurAPI } from '../api.js';
import PlayerCard from '../components/PlayerCard.jsx';
import { POSTE_FULL, playerRadar } from '../utils.js';
import { VizCard, RadarChart, StatRing, BarChart } from '../components/Charts.jsx';
import { Reveal } from '../anim.jsx';

function StatBig({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value ?? 0}</div>
    </div>
  );
}

export default function VisitorJoueurDetails() {
  const { id } = useParams();
  const [joueur, setJoueur] = useState(null);

  useEffect(() => { JoueurAPI.get(id).then(setJoueur); }, [id]);

  if (!joueur) return <div className="v-container"><div className="empty">Chargement…</div></div>;

  const goalsPerMatch = joueur.matchsJoues > 0 ? (joueur.buts / joueur.matchsJoues).toFixed(2) : '—';
  const age = joueur.dateNaissance
    ? Math.floor((Date.now() - new Date(joueur.dateNaissance)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const radar = playerRadar(joueur);
  const contributions = [
    { label: 'Buts', value: joueur.buts ?? 0 },
    { label: 'Passes', value: joueur.passesDecisives ?? 0 },
    { label: 'Jaunes', value: joueur.cartonsJaunes ?? 0 },
    { label: 'Rouges', value: joueur.cartonsRouges ?? 0 },
  ];

  return (
    <div className="v-container" style={{ gridTemplateColumns: '280px 1fr' }}>
      <div>
        <Link to="/joueurs" style={{ color: 'var(--muted)', fontSize: 13 }}>← Tous les joueurs</Link>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <PlayerCard joueur={joueur} />
        </div>
      </div>
      <div>
        <h1 className="v-page-title">{joueur.prenom} {joueur.nom}</h1>
        <div className="v-page-sub">
          {POSTE_FULL[joueur.poste] || '—'}
          {age !== null && ` · ${age} ans`}
          {joueur.nationalite && ` · ${joueur.nationalite}`}
          {joueur.equipe && <> · <Link to={`/equipes/${joueur.equipe.id}`}>{joueur.equipe.nom}</Link></>}
        </div>

        <div className="eyebrow" style={{ marginTop: 24 }}>Player Analytics</div>
        <Reveal className="viz-grid" stagger={0.12}>
          <VizCard title="Profil de" highlight="performance" tag="0–100">
            <RadarChart axes={radar} max={100} size={230} />
          </VizCard>
          <VizCard title="Contribution" highlight="offensive" tag="saison">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <StatRing value={joueur.matchsJoues ?? 0} max={38} size={88} caption="matches" />
              <StatRing value={Number(goalsPerMatch) || 0} max={2} size={88} caption="buts/m" decimals={2} />
            </div>
            <BarChart data={contributions} />
          </VizCard>
        </Reveal>

        <h3 style={{ marginTop: 24 }}>Statistiques de la saison</h3>
        <div className="stats">
          <StatBig label="Matches joués" value={joueur.matchsJoues} />
          <StatBig label="Buts" value={joueur.buts} />
          <StatBig label="Passes déc." value={joueur.passesDecisives} />
          <StatBig label="Cartons jaunes" value={joueur.cartonsJaunes} />
          <StatBig label="Cartons rouges" value={joueur.cartonsRouges} />
          <StatBig label="Buts / match" value={goalsPerMatch} />
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>Profil</h3>
          <table>
            <tbody>
              <tr><th>Nom complet</th><td>{joueur.prenom} {joueur.nom}</td></tr>
              <tr><th>Poste</th><td>{POSTE_FULL[joueur.poste] || '—'}</td></tr>
              <tr><th>Numéro</th><td>{joueur.numero ?? '—'}</td></tr>
              <tr><th>Nationalité</th><td>{joueur.nationalite || '—'}</td></tr>
              <tr><th>Date de naissance</th><td>{joueur.dateNaissance || '—'}</td></tr>
              <tr><th>Équipe</th><td>{joueur.equipe?.nom || '—'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
