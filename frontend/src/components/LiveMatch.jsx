import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { JoueurAPI, MatcheAPI } from '../api.js';
import TeamLogo from './TeamLogo.jsx';
import { useToast } from './Toast.jsx';

const CHANCES = [
  "Frappe enroulée… juste à côté du poteau !",
  "Quelle occasion ! Le gardien s'interpose d'une claquette",
  "Tir puissant repoussé in extremis par la défense",
  "Corner dangereux, mais la défense se dégage",
  "Contre-attaque éclair… le centre est trop long",
  "Coup franc bien placé, le mur fait le travail",
  "Tête plongeante captée par le gardien",
  "L'arbitre refuse le but pour hors-jeu !"
];
const GOALS = [
  "BUUUT ! {p} trouve la lucarne d'une frappe somptueuse !",
  "BUT ! {p} d'une frappe chirurgicale au ras du poteau !",
  "BUT ! {p} reprend de volée un centre parfait !",
  "BUT ! {p} transforme le penalty en pleine confiance !",
  "BUT ! {p} conclut une action collective de toute beauté !"
];
const YELLOWS = [
  "Carton jaune pour {p} après un tacle appuyé",
  "{p} averti pour contestation",
  "Faute tactique de {p}, jaune logique"
];

const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

/** Pick a scorer weighted by position and rating. */
function pickScorer(players) {
  if (!players?.length) return null;
  const weight = j => {
    const pos = { ATTAQUANT: 5, MILIEU: 3, DEFENSEUR: 1, GARDIEN: 0.2 }[j.poste] ?? 2;
    return pos;
  };
  const total = players.reduce((s, j) => s + weight(j), 0);
  let r = Math.random() * total;
  for (const j of players) { r -= weight(j); if (r <= 0) return j; }
  return players[players.length - 1];
}

const playerName = j => j ? `${j.prenom} ${j.nom}` : null;

export default function LiveMatch({ match, onClose, onSaved }) {
  const toast = useToast();
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [minute, setMinute] = useState(0);
  const [score, setScore] = useState({ s1: 0, s2: 0 });
  const [events, setEvents] = useState([]);
  const [phase, setPhase] = useState('pre');     // pre | live | et | done
  const [speed, setSpeed] = useState(2);
  const [saving, setSaving] = useState(false);
  const [goalFlash, setGoalFlash] = useState(0);
  // Mutable sim ledger (scorers / cards) — read once at save time.
  const ledger = useRef({ stats: new Map(), s1: 0, s2: 0 });

  useEffect(() => {
    Promise.all([JoueurAPI.list(match.equipe1.id), JoueurAPI.list(match.equipe2.id)])
      .then(([a, b]) => { setPlayers1(a); setPlayers2(b); })
      .catch(() => {});
  }, [match]);

  const strength1 = 70;
  const strength2 = 70;

  const pushEvent = (ev) => setEvents(list => [ev, ...list]);

  const bumpStat = (j, key) => {
    if (!j) return;
    const cur = ledger.current.stats.get(j.id) || { joueur: j, buts: 0, cartonsJaunes: 0, cartonsRouges: 0 };
    cur[key] += 1;
    ledger.current.stats.set(j.id, cur);
  };

  const scoreGoal = (team, m, golden = false) => {
    const players = team === 1 ? players1 : players2;
    const scorer = pickScorer(players);
    bumpStat(scorer, 'buts');
    ledger.current[team === 1 ? 's1' : 's2'] += 1;
    setScore({ s1: ledger.current.s1, s2: ledger.current.s2 });
    setGoalFlash(f => f + 1);
    const name = playerName(scorer) || (team === 1 ? match.equipe1.nom : match.equipe2.nom);
    pushEvent({
      minute: m, type: 'goal', team,
      text: golden ? `BUT EN OR ! ${name} libère son équipe !` : rnd(GOALS).replace('{p}', name)
    });
  };

  // Sim clock
  useEffect(() => {
    if (phase !== 'live' && phase !== 'et') return;
    const tick = setInterval(() => {
      setMinute(prev => {
        const m = prev + 1;
        const tie = ledger.current.s1 === ledger.current.s2;

        // Phase transitions
        if (m === 46) pushEvent({ minute: 45, type: 'info', text: 'Mi-temps. Les joueurs rentrent aux vestiaires.' });
        if (m > 90 && phase === 'live') {
          if (!tie) { setPhase('done'); pushEvent({ minute: 90, type: 'info', text: "Coup de sifflet final !" }); return 90; }
          setPhase('et');
          pushEvent({ minute: 90, type: 'info', text: 'Égalité ! Prolongations — le prochain but en or est décisif.' });
          return m;
        }
        if (phase === 'et' && !tie) { setPhase('done'); return prev; }
        if (m >= 120 && phase === 'et') {
          // Guaranteed golden goal so the bracket always gets a winner
          const favored = strength1 + Math.random() * 20 > strength2 + Math.random() * 20 ? 1 : 2;
          scoreGoal(favored, 120, true);
          setPhase('done');
          pushEvent({ minute: 120, type: 'info', text: "C'est terminé sur ce but en or !" });
          return 120;
        }

        // Random events — goal probability scaled by team strength
        const base = phase === 'et' ? 0.035 : 0.024;
        const p1 = base * (strength1 / ((strength1 + strength2) / 2));
        const p2 = base * (strength2 / ((strength1 + strength2) / 2));
        const roll = Math.random();
        if (roll < p1) {
          scoreGoal(1, m, phase === 'et');
          if (phase === 'et') { setPhase('done'); pushEvent({ minute: m, type: 'info', text: "C'est terminé !" }); }
        } else if (roll < p1 + p2) {
          scoreGoal(2, m, phase === 'et');
          if (phase === 'et') { setPhase('done'); pushEvent({ minute: m, type: 'info', text: "C'est terminé !" }); }
        } else if (roll < p1 + p2 + 0.05) {
          const team = Math.random() < 0.5 ? 1 : 2;
          pushEvent({ minute: m, type: 'chance', team, text: rnd(CHANCES) });
        } else if (roll < p1 + p2 + 0.065) {
          const team = Math.random() < 0.5 ? 1 : 2;
          const j = pickScorer(team === 1 ? players1 : players2);
          bumpStat(j, 'cartonsJaunes');
          pushEvent({ minute: m, type: 'yellow', team, text: rnd(YELLOWS).replace('{p}', playerName(j) || 'un joueur') });
        }
        return m;
      });
    }, 320 / speed);
    return () => clearInterval(tick);
  }, [phase, speed, players1, players2, strength1, strength2]);

  const start = () => {
    setPhase('live');
    pushEvent({ minute: 0, type: 'info', text: `Coup d'envoi ! ${match.equipe1.nom} face à ${match.equipe2.nom}.` });
  };

  const save = async () => {
    setSaving(true);
    try {
      await MatcheAPI.updateScore(match.id, ledger.current.s1, ledger.current.s2);
      const statsUpdates = [...players1, ...players2].map(j => {
        const delta = ledger.current.stats.get(j.id);
        return {
          joueurId: j.id,
          buts: delta?.buts ?? 0,
          passesDecisives: 0, // Simulator does not track assists specifically
          cartonsJaunes: delta?.cartonsJaunes ?? 0,
          cartonsRouges: delta?.cartonsRouges ?? 0
        };
      });
      await MatcheAPI.updatePlayerStats(match.id, statsUpdates);
      toast.success('Résultat enregistré — stats des joueurs mises à jour');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
      setSaving(false);
    }
  };

  const minuteLabel = phase === 'done'
    ? (minute > 90 ? 'TAB/Prol.' : 'Terminé')
    : `${Math.min(minute, 120)}'`;

  return (
    <div className="modal-overlay" onClick={phase === 'pre' ? onClose : undefined}>
      <div className="modal modal-wide live-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Match en direct</h3>
            <p className="modal-sub">Simulation minute par minute.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>

        <div className="live-board">
          <div className="live-team">
            <TeamLogo equipe={match.equipe1} size={44} />
            <div className="live-team-name">{match.equipe1.nom}</div>
            <div className="live-strength">FORCE {Math.round(strength1)}</div>
          </div>
          <div className="live-center">
            <div className={`live-score ${goalFlash ? 'flash' : ''}`} key={goalFlash}>
              {score.s1} <span>–</span> {score.s2}
            </div>
            <div className={`live-minute ${phase === 'live' || phase === 'et' ? 'on' : ''}`}>
              {phase === 'pre' ? 'Prêt' : minuteLabel}
              {phase === 'et' && ' (prol.)'}
            </div>
            <div className="live-progress"><i style={{ width: `${Math.min(minute / 120 * 100, 100)}%` }} /></div>
          </div>
          <div className="live-team">
            <TeamLogo equipe={match.equipe2} size={44} />
            <div className="live-team-name">{match.equipe2.nom}</div>
            <div className="live-strength">FORCE {Math.round(strength2)}</div>
          </div>
        </div>

        {phase === 'pre' ? (
          <div className="live-actions">
            <button className="btn btn-primary" onClick={start}>▶ Coup d'envoi</button>
          </div>
        ) : (
          <>
            {(phase === 'live' || phase === 'et') && (
              <div className="live-actions">
                {[1, 2, 4].map(s => (
                  <button key={s} className={`btn btn-sm ${speed === s ? 'btn-primary' : ''}`}
                          onClick={() => setSpeed(s)}>×{s}</button>
                ))}
              </div>
            )}
            <div className="live-feed">
              {events.map((ev, i) => (
                <div key={events.length - i} className={`live-event ${ev.type}`}>
                  <span className="live-ev-min">{ev.minute}'</span>
                  <span className="live-ev-ico">
                    {ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : ev.type === 'red' ? '🟥' : ev.type === 'chance' ? '⚡' : '📢'}
                  </span>
                  <span className="live-ev-team">
                    {ev.team === 1 ? match.equipe1.nom : ev.team === 2 ? match.equipe2.nom : ''}
                  </span>
                  <span className="live-ev-text">{ev.text}</span>
                </div>
              ))}
            </div>
            {phase === 'done' && (
              <div className="modal-actions">
                <button className="btn" onClick={onClose} disabled={saving}>Fermer sans enregistrer</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer le résultat'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
