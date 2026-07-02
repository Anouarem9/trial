import { useEffect, useState } from 'react';
import { TournoiAPI, EquipeAPI, JoueurAPI } from '../api.js';
import { Link } from 'react-router-dom';
import { VizCard, DonutChart, BarChart, StatRing } from '../components/Charts.jsx';
import { CountUp, Reveal } from '../anim.jsx';
import { POSTE_FULL } from '../utils.js';

export default function Dashboard() {
  const [tournois, setTournois] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([TournoiAPI.list(), EquipeAPI.list(), JoueurAPI.list()])
      .then(([t, e, j]) => { setTournois(t); setEquipes(e); setJoueurs(j); })
      .catch(e => setErr(e.message));
  }, []);

  const enCours = tournois.filter(t => t.statut === 'EN_COURS');
  const aVenir = tournois.filter(t => t.statut === 'A_VENIR');
  const termine = tournois.filter(t => t.statut === 'TERMINE');

  const statutData = [
    { label: 'En cours', value: enCours.length, color: '#38bdf8' },
    { label: 'À venir', value: aVenir.length, color: '#64748b' },
    { label: 'Terminés', value: termine.length, color: '#34d399' },
  ].filter(d => d.value > 0);

  const topScorers = [...joueurs]
    .sort((a, b) => (b.buts ?? 0) - (a.buts ?? 0))
    .slice(0, 6)
    .map(j => ({ label: `${j.prenom?.[0] ?? ''}. ${j.nom}`, value: j.buts ?? 0 }));

  const posteColors = { GARDIEN: '#fbbf24', DEFENSEUR: '#34d399', MILIEU: '#a78bfa', ATTAQUANT: '#38bdf8' };
  const posteData = Object.keys(POSTE_FULL).map(p => ({
    label: POSTE_FULL[p],
    value: joueurs.filter(j => j.poste === p).length,
    color: posteColors[p],
  })).filter(d => d.value > 0);

  const totalButs = joueurs.reduce((s, j) => s + (j.buts ?? 0), 0);
  const totalPasses = joueurs.reduce((s, j) => s + (j.passesDecisives ?? 0), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Tournament Intelligence</div>
          <h2>Tableau de bord</h2>
        </div>
      </div>
      {err && <div className="error">{err}</div>}

      <Reveal className="stats" stagger={0.08} immediate>
        <div className="stat-card"><div className="label">Tournois</div><div className="value"><CountUp value={tournois.length} /></div></div>
        <div className="stat-card"><div className="label">En cours</div><div className="value"><CountUp value={enCours.length} /></div></div>
        <div className="stat-card"><div className="label">Équipes</div><div className="value"><CountUp value={equipes.length} /></div></div>
        <div className="stat-card"><div className="label">Joueurs</div><div className="value"><CountUp value={joueurs.length} /></div></div>
        <div className="stat-card"><div className="label">Buts cumulés</div><div className="value"><CountUp value={totalButs} /></div></div>
      </Reveal>

      <Reveal className="viz-grid" stagger={0.1} immediate style={{ marginTop: 16 }}>
        <VizCard title="Répartition des" highlight="tournois" tag={`${tournois.length} total`}>
          {statutData.length
            ? <DonutChart data={statutData} />
            : <div className="empty" style={{ padding: 24 }}>Aucun tournoi</div>}
        </VizCard>

        <VizCard title="Meilleurs" highlight="buteurs" tag="buts">
          {topScorers.length
            ? <BarChart data={topScorers} />
            : <div className="empty" style={{ padding: 24 }}>Aucun joueur</div>}
        </VizCard>

        <VizCard title="Effectifs par" highlight="poste" tag={`${joueurs.length} joueurs`}>
          {posteData.length
            ? <DonutChart data={posteData} />
            : <div className="empty" style={{ padding: 24 }}>Aucun joueur</div>}
        </VizCard>

        <VizCard title="Passes décisives" highlight="cumulées" tag="assists">
          <div className="ring-wrap" style={{ justifyContent: 'center', padding: '6px 0' }}>
            <StatRing value={totalPasses} max={Math.max(10, totalPasses)} size={120} stroke={11} caption="passes" />
          </div>
        </VizCard>
      </Reveal>

      <Reveal as="div" className="card" style={{ marginTop: 8 }}>
        <h3 style={{ marginTop: 0 }}>Tournois récents</h3>
        {tournois.length === 0 ? (
          <div className="empty">Aucun tournoi pour le moment. <Link to="/admin/tournois">Créer le premier</Link></div>
        ) : (
          <table>
            <thead><tr><th>Nom</th><th>Lieu</th><th>Date</th><th>Statut</th></tr></thead>
            <tbody>
              {tournois.slice(0, 8).map(t => (
                <tr key={t.id}>
                  <td><Link to={`/admin/tournois/${t.id}`}>{t.nom}</Link></td>
                  <td>{t.lieu || '—'}</td>
                  <td>{t.dateDebut}</td>
                  <td><span className={`badge badge-${t.statut}`}>{t.statut.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Reveal>
    </>
  );
}
