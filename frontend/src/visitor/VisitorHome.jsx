import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TournoiAPI } from '../api.js';
import TeamLogo from '../components/TeamLogo.jsx';
import { Reveal } from '../anim.jsx';
import { formatMatchTime, sameDay } from '../utils.js';

function buildDateTabs() {
  const tabs = [];
  const labels = ['Hier', "Aujourd'hui", 'Demain'];
  for (let i = -1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = i >= -1 && i <= 1
      ? labels[i + 1]
      : d.toLocaleDateString('fr-FR', { weekday: 'short' });
    tabs.push({
      key: d.toISOString().slice(0, 10),
      date: d,
      label,
      shortDate: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    });
  }
  return tabs;
}

const STATUS_LABEL = { TERMINE: 'FT', A_VENIR: '', EN_COURS: 'LIVE' };

function MatchRow({ match }) {
  const e1Win = match.scoreEquipe1 != null && match.scoreEquipe2 != null && match.scoreEquipe1 > match.scoreEquipe2;
  const e2Win = match.scoreEquipe1 != null && match.scoreEquipe2 != null && match.scoreEquipe2 > match.scoreEquipe1;
  const status = STATUS_LABEL[match.statut];

  return (
    <Link to={`/matches/${match.id}`} style={{ display: 'block' }}>
      <div className="v-match">
        <div className="v-match-time">
          {status && <span className={`status ${match.statut}`}>{status}</span>}
          {!status && <span>{formatMatchTime(match.dateMatch)}</span>}
        </div>
        <div className="v-match-teams">
          <div className={`v-team-row ${e1Win ? 'winner' : ''} ${e2Win ? 'loser' : ''}`}>
            <TeamLogo equipe={match.equipe1} />
            <div className="v-team-name">{match.equipe1?.nom || 'À déterminer'}</div>
            <div className="v-team-score">{match.scoreEquipe1 ?? '—'}</div>
          </div>
          <div className={`v-team-row ${e2Win ? 'winner' : ''} ${e1Win ? 'loser' : ''}`}>
            <TeamLogo equipe={match.equipe2} />
            <div className="v-team-name">{match.equipe2?.nom || 'À déterminer'}</div>
            <div className="v-team-score">{match.scoreEquipe2 ?? '—'}</div>
          </div>
        </div>
        <div className="v-match-fav">☆</div>
      </div>
    </Link>
  );
}

export default function VisitorHome() {
  const [tournois, setTournois] = useState([]);
  const [allMatches, setAllMatches] = useState([]); // [{ tournoi, matches: [] }]
  const [err, setErr] = useState(null);
  const tabs = useMemo(buildDateTabs, []);
  const [selectedDate, setSelectedDate] = useState(tabs.find(t => t.label === "Aujourd'hui").key);

  useEffect(() => {
    TournoiAPI.list()
      .then(async ts => {
        setTournois(ts);
        const enriched = await Promise.all(ts.map(async t => ({
          tournoi: t,
          matches: await TournoiAPI.matches(t.id)
        })));
        setAllMatches(enriched);
      })
      .catch(e => setErr(e.message));
  }, []);

  const blocks = allMatches
    .map(({ tournoi, matches }) => ({
      tournoi,
      matches: matches.filter(m => m.dateMatch && sameDay(m.dateMatch, selectedDate))
    }))
    .filter(b => b.matches.length > 0);

  const totalToday = blocks.reduce((acc, b) => acc + b.matches.length, 0);

  return (
    <div className="v-container">
      <div>
        <h1 className="v-page-title">Matches</h1>
        <div className="v-page-sub">{totalToday} match{totalToday > 1 ? 'es' : ''} programmé{totalToday > 1 ? 's' : ''} ce jour</div>

        <div className="v-date-tabs">
          {tabs.map(t => (
            <button key={t.key}
                    className={`v-date-tab ${selectedDate === t.key ? 'active' : ''}`}
                    onClick={() => setSelectedDate(t.key)}>
              <span className="day">{t.label}</span>
              <span className="date">{t.shortDate}</span>
            </button>
          ))}
        </div>

        {err && <div className="error">{err}</div>}

        {blocks.length === 0 ? (
          <div className="v-tournament-block">
            <div className="empty">Aucun match programmé ce jour.</div>
          </div>
        ) : (
          <Reveal key={selectedDate} stagger={0.09}>
            {blocks.map(({ tournoi, matches }) => (
              <div className="v-tournament-block" key={tournoi.id}>
                <div className="v-tournament-header">
                  <div className="v-name">
                    <div className="v-flag" />
                    <Link to={`/tournois/${tournoi.id}`}>{tournoi.nom}</Link>
                  </div>
                  <Link to={`/tournois/${tournoi.id}`}>Voir tout →</Link>
                </div>
                {matches.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            ))}
          </Reveal>
        )}
      </div>

      <aside className="v-sidebar">
        <h3>Tournois populaires</h3>
        <div className="v-sidebar-panel">
          {tournois.slice(0, 6).map(t => (
            <Link to={`/tournois/${t.id}`} key={t.id}>
              <div className="v-tournament-item">
                <div className="v-icon">{t.nom[0]}</div>
                <div className="v-meta">
                  <div className="v-title">{t.nom}</div>
                  <div className="v-sub">{t.lieu || 'Lieu non précisé'}</div>
                </div>
                <span className={`badge badge-${t.statut}`}>{t.statut.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
