import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { TournoiAPI, EquipeAPI, MatcheAPI, JoueurAPI } from '../api.js';
import Modal from '../components/Modal.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { championOf, formatMatchDate, formatMatchTime } from '../utils.js';

const roundName = (round, totalRounds) => {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Finale';
  if (fromFinal === 1) return 'Demi-finales';
  if (fromFinal === 2) return 'Quarts de finale';
  if (fromFinal === 3) return 'Huitièmes';
  return `Tour ${round}`;
};

const EMPTY_EVENT_DRAFT = { type: 'BUT', minute: '', joueurId: '', assistJoueurId: '' };

const EVENT_TYPES = [
  { value: 'BUT', label: 'But', short: 'B' },
  { value: 'CARTON_JAUNE', label: 'Carton jaune', short: 'CJ' },
  { value: 'CARTON_ROUGE', label: 'Carton rouge', short: 'CR' }
];

const eventType = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

const playerLabel = (joueur) => {
  if (!joueur) return 'Joueur';
  const initial = joueur.prenom ? `${joueur.prenom[0]}. ` : '';
  return `${initial}${joueur.nom}`;
};

export default function TournoiDetails() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const { id } = useParams();
  const [tournoi, setTournoi] = useState(null);
  const [registered, setRegistered] = useState([]);   // teams registered to this tournament
  const [allTeams, setAllTeams] = useState([]);       // all teams (for the picker)
  const [matches, setMatches] = useState([]);
  const [scoring, setScoring] = useState(null);
  const [schedule, setSchedule] = useState({ date: '', lieu: '' });
  const [picker, setPicker] = useState('');
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [matchEvents, setMatchEvents] = useState([]);
  const [eventDraft, setEventDraft] = useState(EMPTY_EVENT_DRAFT);

  const load = () => Promise.all([
    TournoiAPI.get(id),
    EquipeAPI.list(id),
    EquipeAPI.list(),
    TournoiAPI.matches(id)
  ]).then(([t, reg, all, m]) => {
    setTournoi(t); setRegistered(reg); setAllTeams(all); setMatches(m);
  }).catch(e => toast.error(e.message));

  useEffect(() => { load(); }, [id]);

  const generate = async () => {
    if (matches.length > 0 && !confirm('Régénérer le tableau ? Tous les résultats actuels seront effacés.')) return;
    try {
      await TournoiAPI.generateBracket(id);
      toast.success('Tableau généré — bonne compétition !');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const openScoring = async (m) => {
    if (!canEdit) return;
    setScoring(m);
    setSchedule({
      date: m.dateMatch ? m.dateMatch.slice(0, 16) : '',
      lieu: m.lieu || ''
    });
    setPlayers1([]);
    setPlayers2([]);
    setMatchEvents([]);
    setEventDraft(EMPTY_EVENT_DRAFT);

    if (m.equipe1 && m.equipe2) {
      try {
        const [p1, p2, existingEvents] = await Promise.all([
          JoueurAPI.list(m.equipe1.id),
          JoueurAPI.list(m.equipe2.id),
          MatcheAPI.getEvents(m.id)
        ]);
        setPlayers1(p1);
        setPlayers2(p2);

        const events = existingEvents.map(event => {
          return {
            localId: `saved-${event.id}`,
            id: event.id,
            type: event.type,
            minute: event.minute ?? '',
            joueurId: event.joueur?.id ? String(event.joueur.id) : '',
            assistJoueurId: event.assistJoueur?.id ? String(event.assistJoueur.id) : ''
          };
        });
        setMatchEvents(events);
      } catch (e) {
        toast.error("Erreur de chargement des effectifs : " + e.message);
      }
    }
  };

  const saveScore = async (e) => {
    e.preventDefault();
    try {
      const goalCounts = goalsByTeam();

      if (goalCounts.equipe1 === goalCounts.equipe2) {
        toast.error('Le journal doit designer un vainqueur pour valider un match a elimination directe');
        return;
      }

      await MatcheAPI.updateScore(scoring.id, goalCounts.equipe1, goalCounts.equipe2);
      await MatcheAPI.updateEvents(scoring.id, {
        events: matchEvents.map(event => ({
          type: event.type,
          minute: event.minute === '' ? 0 : parseInt(event.minute, 10),
          joueurId: parseInt(event.joueurId, 10),
          assistJoueurId: event.type === 'BUT' && event.assistJoueurId ? parseInt(event.assistJoueurId, 10) : null
        })),
        playedPlayerIds: allMatchPlayers.map(player => Number(player.id))
      });

      toast.success('Score et journal du match enregistres');
      setScoring(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const saveSchedule = async () => {
    try {
      await MatcheAPI.updateSchedule(scoring.id, schedule.date || null, schedule.lieu || null);
      toast.success('Match programmé');
      setScoring(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const registerTeam = async () => {
    if (!picker) return;
    try {
      await TournoiAPI.registerEquipe(id, picker);
      toast.success('Équipe inscrite');
      setPicker('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const unregisterTeam = async (eid) => {
    if (!confirm('Retirer cette équipe du tournoi ?')) return;
    try {
      await TournoiAPI.unregisterEquipe(id, eid);
      toast.success('Équipe retirée');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const allMatchPlayers = useMemo(() => [...players1, ...players2], [players1, players2]);
  const playerById = useMemo(() => {
    const map = new Map();
    allMatchPlayers.forEach(player => map.set(String(player.id), player));
    return map;
  }, [allMatchPlayers]);

  const eventStats = useMemo(() => {
    const stats = new Map();
    const ensure = (playerId) => {
      const key = String(playerId);
      if (!stats.has(key)) {
        stats.set(key, { buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0 });
      }
      return stats.get(key);
    };

    matchEvents.forEach(event => {
      const playerStats = ensure(event.joueurId);
      if (event.type === 'BUT') {
        playerStats.buts += 1;
        if (event.assistJoueurId) {
          ensure(event.assistJoueurId).passesDecisives += 1;
        }
      } else if (event.type === 'CARTON_JAUNE') {
        playerStats.cartonsJaunes += 1;
      } else if (event.type === 'CARTON_ROUGE') {
        playerStats.cartonsRouges += 1;
      }
    });

    return stats;
  }, [matchEvents]);

  const goalsByTeam = () => {
    const counts = { equipe1: 0, equipe2: 0 };
    matchEvents
      .filter(event => event.type === 'BUT')
      .forEach(event => {
        const player = playerById.get(String(event.joueurId));
        if (player?.equipe?.id === scoring?.equipe1?.id) counts.equipe1 += 1;
        if (player?.equipe?.id === scoring?.equipe2?.id) counts.equipe2 += 1;
      });
    return counts;
  };

  const addEvent = () => {
    if (!eventDraft.joueurId) {
      toast.error('Choisissez le joueur concerne');
      return;
    }

    const minute = eventDraft.minute === '' ? 0 : parseInt(eventDraft.minute, 10);
    if (Number.isNaN(minute) || minute < 0 || minute > 130) {
      toast.error('La minute doit etre comprise entre 0 et 130');
      return;
    }

    const player = playerById.get(String(eventDraft.joueurId));
    const assistPlayer = eventDraft.assistJoueurId ? playerById.get(String(eventDraft.assistJoueurId)) : null;
    if (eventDraft.type === 'BUT' && assistPlayer && assistPlayer.equipe?.id !== player?.equipe?.id) {
      toast.error('Le passeur doit etre dans la meme equipe que le buteur');
      return;
    }

    setMatchEvents(prev => [
      ...prev,
      {
        ...eventDraft,
        minute,
        assistJoueurId: eventDraft.type === 'BUT' ? eventDraft.assistJoueurId : '',
        localId: `new-${Date.now()}-${Math.random()}`
      }
    ]);
    setEventDraft(prev => ({ ...EMPTY_EVENT_DRAFT, type: prev.type }));
  };

  const removeEvent = (localId) => {
    setMatchEvents(prev => prev.filter(event => event.localId !== localId));
  };

  if (!tournoi) return <div className="empty">Chargement...</div>;

  const totalRounds = matches.length ? Math.max(...matches.map(m => m.round)) : 0;
  const grouped = {};
  matches.forEach(m => { (grouped[m.round] ||= []).push(m); });

  const registeredIds = new Set(registered.map(e => e.id));
  const available = allTeams.filter(e => !registeredIds.has(e.id));
  const isFull = registered.length >= tournoi.nombreEquipes;
  const champion = tournoi.statut === 'TERMINE' ? championOf(matches) : null;
  const selectedEventPlayer = playerById.get(String(eventDraft.joueurId));
  const assistOptions = selectedEventPlayer
    ? allMatchPlayers.filter(player =>
        player.equipe?.id === selectedEventPlayer.equipe?.id && String(player.id) !== String(selectedEventPlayer.id))
    : [];
  const sortedEvents = [...matchEvents].sort((a, b) => {
    const minuteA = a.minute === '' ? 0 : Number(a.minute);
    const minuteB = b.minute === '' ? 0 : Number(b.minute);
    return minuteA - minuteB;
  });
  const currentGoalCounts = goalsByTeam();
  const hasWinner = currentGoalCounts.equipe1 !== currentGoalCounts.equipe2;
  const statRows = Array.from(eventStats.entries())
    .map(([playerId, stats]) => ({ player: playerById.get(playerId), stats }))
    .filter(row => row.player && Object.values(row.stats).some(value => value > 0));

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/admin/tournois">← Retour</Link>
          <h2 style={{ marginTop: 4 }}>{tournoi.nom}</h2>
          <div style={{ color: 'var(--muted)' }}>
            {tournoi.lieu || 'Lieu non précisé'} · {tournoi.dateDebut}
            {tournoi.dateFin ? ` → ${tournoi.dateFin}` : ''} ·{' '}
            <span className={`badge badge-${tournoi.statut}`}>{tournoi.statut.replace('_', ' ')}</span>
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={generate}
                  disabled={registered.length !== tournoi.nombreEquipes}>
            {matches.length > 0 ? 'Régénérer le tableau' : 'Générer le tableau'}
          </button>
        )}
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Équipes inscrites ({registered.length} / {tournoi.nombreEquipes})</h3>
        {registered.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>Aucune équipe inscrite pour le moment.</div>
        ) : (
          <table>
            <tbody>
              {registered.map(e => (
                <tr key={e.id}>
                  <td style={{ width: 50 }}><TeamLogo equipe={e} size={36} /></td>
                  <td><Link to={`/admin/equipes/${e.id}`}><strong>{e.nom}</strong></Link></td>
                  <td>{e.ville || '—'}</td>
                  <td>{e.entraineur || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {canEdit && (
                      <button className="btn btn-sm btn-danger" onClick={() => unregisterTeam(e.id)}
                              disabled={matches.length > 0}
                              title={matches.length > 0 ? 'Régénérer le tableau pour désinscrire une équipe' : ''}>
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canEdit && !isFull && (
          <div className="row" style={{ marginTop: 16, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
              <label>Inscrire une équipe</label>
              <select value={picker} onChange={e => setPicker(e.target.value)}>
                <option value="">— Choisir une équipe —</option>
                {available.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nom}{e.ville ? ` (${e.ville})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={registerTeam} disabled={!picker}>
              Inscrire
            </button>
          </div>
        )}
        {canEdit && available.length === 0 && !isFull && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
            Aucune équipe disponible. Créez-en dans la page <Link to="/admin/equipes">Équipes</Link>.
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tableau (élimination directe)</h3>
        {matches.length === 0 ? (
          <div className="empty">
            Le tableau n'est pas encore généré. Inscrivez {tournoi.nombreEquipes} équipes puis cliquez sur « Générer le tableau ».
          </div>
        ) : (
          <div className="bracket">
            {Object.keys(grouped).sort((a, b) => a - b).map(r => (
              <div className="round" key={r}>
                <div className="round-title">{roundName(parseInt(r), totalRounds)}</div>
                {grouped[r].map(m => {
                  const e1Win = m.scoreEquipe1 != null && m.scoreEquipe2 != null && m.scoreEquipe1 > m.scoreEquipe2;
                  const e2Win = m.scoreEquipe1 != null && m.scoreEquipe2 != null && m.scoreEquipe2 > m.scoreEquipe1;
                  return (
                    <div key={m.id} className="bracket-match" onClick={() => openScoring(m)}>
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

      {scoring && (
        <Modal title="Gérer le match" wide
               subtitle={scoring.equipe1 && scoring.equipe2
                 ? `${scoring.equipe1.nom} vs ${scoring.equipe2.nom}`
                 : 'Équipes à déterminer par les rounds précédents'}
               onClose={() => setScoring(null)}>
          <h4 style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Programmation
          </h4>
          <div className="row">
            <div className="form-group">
              <label>Date et heure</label>
              <input type="datetime-local" value={schedule.date}
                     onChange={e => setSchedule({ ...schedule, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input placeholder="Stade…" value={schedule.lieu}
                     onChange={e => setSchedule({ ...schedule, lieu: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button type="button" className="btn btn-sm" onClick={saveSchedule}>Enregistrer la programmation</button>
          </div>

          {scoring.equipe1 && scoring.equipe2 && (
            <form onSubmit={saveScore} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <h4 className="match-log-title first">Journal des evenements</h4>
              <div className="event-builder">
                <div className="form-group event-minute">
                  <label>Min.</label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={eventDraft.minute}
                    onChange={e => setEventDraft({ ...eventDraft, minute: e.target.value })}
                    placeholder="45"
                  />
                </div>
                <div className="form-group event-type">
                  <label>Action</label>
                  <select
                    value={eventDraft.type}
                    onChange={e => setEventDraft({ ...eventDraft, type: e.target.value, assistJoueurId: '' })}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group event-player">
                  <label>Joueur</label>
                  <select
                    value={eventDraft.joueurId}
                    onChange={e => setEventDraft({ ...eventDraft, joueurId: e.target.value, assistJoueurId: '' })}
                  >
                    <option value="">Choisir</option>
                    {allMatchPlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {playerLabel(player)} - {player.equipe?.nom}
                      </option>
                    ))}
                  </select>
                </div>
                {eventDraft.type === 'BUT' && (
                  <div className="form-group event-assist">
                    <label>Passeur</label>
                    <select
                      value={eventDraft.assistJoueurId}
                      onChange={e => setEventDraft({ ...eventDraft, assistJoueurId: e.target.value })}
                      disabled={!selectedEventPlayer}
                    >
                      <option value="">Aucun</option>
                      {assistOptions.map(player => (
                        <option key={player.id} value={player.id}>{playerLabel(player)}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="button" className="btn btn-primary event-add" onClick={addEvent}>
                  Ajouter
                </button>
              </div>

              <div className={`score-audit ${hasWinner ? 'ok' : 'warn'}`}>
                <span>Score calcule : {currentGoalCounts.equipe1}-{currentGoalCounts.equipe2}</span>
                <span>{hasWinner ? 'Pret a valider' : 'Ajoutez les buts pour designer un vainqueur'}</span>
              </div>

              <div className="event-timeline">
                {sortedEvents.length === 0 ? (
                  <div className="event-empty">Aucun evenement ajoute.</div>
                ) : sortedEvents.map(event => {
                  const player = playerById.get(String(event.joueurId));
                  const assist = event.assistJoueurId ? playerById.get(String(event.assistJoueurId)) : null;
                  const type = eventType(event.type);
                  return (
                    <div className="event-row" key={event.localId}>
                      <div className="event-min">{event.minute || 0}'</div>
                      <div className={`event-badge type-${event.type}`}>{type.short}</div>
                      <div className="event-main">
                        <strong>{playerLabel(player)}</strong>
                        <span>{type.label}{assist ? ` - passe de ${playerLabel(assist)}` : ''}</span>
                      </div>
                      <button type="button" className="btn btn-sm" onClick={() => removeEvent(event.localId)}>
                        Retirer
                      </button>
                    </div>
                  );
                })}
              </div>

              {statRows.length > 0 && (
                <div className="derived-stats">
                  <div className="derived-title">Totaux calcules</div>
                  {statRows.map(({ player, stats }) => (
                    <div className="derived-row" key={player.id}>
                      <span>{playerLabel(player)}</span>
                      <b>B {stats.buts}</b>
                      <b>P {stats.passesDecisives}</b>
                      <b>CJ {stats.cartonsJaunes}</b>
                      <b>CR {stats.cartonsRouges}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setScoring(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider le match</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
