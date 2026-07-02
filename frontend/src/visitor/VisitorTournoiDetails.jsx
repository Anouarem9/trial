import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { TournoiAPI, EquipeAPI } from '../api.js';
import TeamLogo from '../components/TeamLogo.jsx';
import { championOf, formatMatchDate, formatMatchTime } from '../utils.js';

const roundName = (round, totalRounds) => {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Finale';
  if (fromFinal === 1) return 'Demi-finales';
  if (fromFinal === 2) return 'Quarts de finale';
  if (fromFinal === 3) return 'Huitièmes';
  return `Tour ${round}`;
};

export default function VisitorTournoiDetails() {
  const { id } = useParams();
  const [tournoi, setTournoi] = useState(null);
  const [equipes, setEquipes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState('matches');

  useEffect(() => {
    Promise.all([TournoiAPI.get(id), EquipeAPI.list(id), TournoiAPI.matches(id)])
      .then(([t, e, m]) => { setTournoi(t); setEquipes(e); setMatches(m); });
  }, [id]);

  if (!tournoi) return <div className="v-container"><div className="empty">Chargement…</div></div>;

  const totalRounds = matches.length ? Math.max(...matches.map(m => m.round)) : 0;
  const grouped = {};
  matches.forEach(m => { (grouped[m.round] ||= []).push(m); });
  const champion = tournoi.statut === 'TERMINE' ? championOf(matches) : null;

  return (
    <div className="v-container" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <Link to="/" style={{ color: 'var(--muted)', fontSize: 13 }}>← Retour aux matches</Link>
        <h1 className="v-page-title" style={{ marginTop: 8 }}>{tournoi.nom}</h1>
        <div className="v-page-sub">
          {tournoi.lieu || 'Lieu non précisé'} · {tournoi.dateDebut}
          {tournoi.dateFin ? ` → ${tournoi.dateFin}` : ''} ·{' '}
          <span className={`badge badge-${tournoi.statut}`}>{tournoi.statut.replace('_', ' ')}</span>
        </div>

        {champion && (
          <div className="champion-banner rise">
            <div className="trophy"><Trophy size={26} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="champ-label">Champion du tournoi</div>
              <div className="champ-name">
                <TeamLogo equipe={champion.equipe} size={28} />
                {champion.equipe?.nom}
              </div>
              <div className="champ-sub">
                Finale : {champion.final.equipe1?.nom} {champion.final.scoreEquipe1} – {champion.final.scoreEquipe2} {champion.final.equipe2?.nom}
              </div>
            </div>
          </div>
        )}

        <div className="v-date-tabs" style={{ marginBottom: 20 }}>
          <button className={`v-date-tab ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>Calendrier</button>
          <button className={`v-date-tab ${tab === 'bracket' ? 'active' : ''}`} onClick={() => setTab('bracket')}>Tableau</button>
          <button className={`v-date-tab ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>Équipes</button>
        </div>

        {tab === 'matches' && (
          <div className="v-tournament-block">
            {matches.length === 0 ? (
              <div className="empty">Le tableau n'est pas encore généré.</div>
            ) : matches.map(m => (
              <Link to={`/matches/${m.id}`} key={m.id}>
                <div className="v-match">
                  <div className="v-match-time">
                    <span style={{ fontSize: 11 }}>{formatMatchDate(m.dateMatch)}</span>
                    <span>{formatMatchTime(m.dateMatch)}</span>
                  </div>
                  <div className="v-match-teams">
                    <div className="v-team-row">
                      <TeamLogo equipe={m.equipe1} />
                      <div className="v-team-name">{m.equipe1?.nom || 'À déterminer'}</div>
                      <div className="v-team-score">{m.scoreEquipe1 ?? '—'}</div>
                    </div>
                    <div className="v-team-row">
                      <TeamLogo equipe={m.equipe2} />
                      <div className="v-team-name">{m.equipe2?.nom || 'À déterminer'}</div>
                      <div className="v-team-score">{m.scoreEquipe2 ?? '—'}</div>
                    </div>
                  </div>
                  <div className="v-match-fav" style={{ fontSize: 11, color: 'var(--muted)' }}>R{m.round}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'bracket' && (
          <div className="card" style={{ overflowX: 'auto' }}>
            {matches.length === 0 ? (
              <div className="empty">Le tableau n'est pas encore généré.</div>
            ) : (
              <div className="bracket">
                {Object.keys(grouped).sort((a, b) => a - b).map(r => (
                  <div className="round" key={r}>
                    <div className="round-title">{roundName(parseInt(r), totalRounds)}</div>
                    {grouped[r].map(m => {
                      const e1Win = m.scoreEquipe1 != null && m.scoreEquipe2 != null && m.scoreEquipe1 > m.scoreEquipe2;
                      const e2Win = m.scoreEquipe1 != null && m.scoreEquipe2 != null && m.scoreEquipe2 > m.scoreEquipe1;
                      return (
                        <div key={m.id} className="bracket-match">
                          <div className={`bracket-team ${e1Win ? 'winner' : ''} ${!m.equipe1 ? 'empty' : ''}`}>
                            <TeamLogo equipe={m.equipe1} size={20} />
                            <span className="name">{m.equipe1?.nom || 'À déterminer'}</span>
                            <span className="score">{m.scoreEquipe1 ?? '—'}</span>
                          </div>
                          <div className={`bracket-team ${e2Win ? 'winner' : ''} ${!m.equipe2 ? 'empty' : ''}`}>
                            <TeamLogo equipe={m.equipe2} size={20} />
                            <span className="name">{m.equipe2?.nom || 'À déterminer'}</span>
                            <span className="score">{m.scoreEquipe2 ?? '—'}</span>
                          </div>
                          {(m.dateMatch || m.lieu) && (
                            <div className="bracket-meta">
                              <span>{m.dateMatch ? `${formatMatchDate(m.dateMatch)} ${formatMatchTime(m.dateMatch)}` : ''}</span>
                              <span>{m.lieu || ''}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'teams' && (
          <div className="team-grid">
            {equipes.map(e => (
              <Link to={`/equipes/${e.id}`} key={e.id}>
                <div className="team-card">
                  <div className="logo">
                    <TeamLogo equipe={e} size={64} />
                  </div>
                  <div className="name">{e.nom}</div>
                  <div className="city">{e.ville || ''}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
