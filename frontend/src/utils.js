/** Resolve image URLs from the API: absolute URLs pass through, /uploads/ paths get prefixed. */
export function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return url; // served via Vite proxy / same origin
  return url;
}

export function initials(...parts) {
  return parts
    .filter(Boolean)
    .map(s => s.trim()[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}

export const POSTE_LABEL = {
  GARDIEN: 'GK',
  DEFENSEUR: 'DEF',
  MILIEU: 'MIL',
  ATTAQUANT: 'ATT'
};

export const POSTE_FULL = {
  GARDIEN: 'Gardien',
  DEFENSEUR: 'Défenseur',
  MILIEU: 'Milieu',
  ATTAQUANT: 'Attaquant'
};

export function cardTier(buts = 0, passes = 0) {
  const score = (buts ?? 0) * 2 + (passes ?? 0);
  if (score >= 12) return 'special';
  if (score >= 6) return 'gold';
  if (score >= 2) return 'silver';
  return 'bronze';
}

export function formatMatchTime(dateMatch) {
  if (!dateMatch) return '—';
  const d = new Date(dateMatch);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatMatchDate(dateMatch) {
  if (!dateMatch) return '';
  const d = new Date(dateMatch);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Derive 5 radar attributes (0–100) from a player's raw stats. */
export function playerRadar(j) {
  const mj = j.matchsJoues || 0;
  const clamp = (x) => Math.max(5, Math.min(100, Math.round(x)));
  const per = (x) => (mj > 0 ? x / mj : 0);
  return [
    { label: 'BUTS', value: clamp(per(j.buts || 0) * 100) },          // ~1 but/match = 100
    { label: 'PASSES', value: clamp(per(j.passesDecisives || 0) * 120) },
    { label: 'PRÉSENCE', value: clamp((mj / 30) * 100) },              // 30 matches = 100
    { label: 'IMPACT', value: clamp(per((j.buts || 0) + (j.passesDecisives || 0)) * 80) },
    { label: 'FAIR-PLAY', value: clamp(100 - ((j.cartonsJaunes || 0) * 8 + (j.cartonsRouges || 0) * 25)) },
  ];
}

/** Winner of the final, or null if the bracket isn't finished. */
export function championOf(matches) {
  if (!matches?.length) return null;
  const maxRound = Math.max(...matches.map(m => m.round));
  const final = matches.find(m =>
    m.round === maxRound && m.statut === 'TERMINE' &&
    m.scoreEquipe1 != null && m.scoreEquipe2 != null);
  if (!final) return null;
  return {
    equipe: final.scoreEquipe1 > final.scoreEquipe2 ? final.equipe1 : final.equipe2,
    final
  };
}

export function sameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear()
      && da.getMonth() === db.getMonth()
      && da.getDate() === db.getDate();
}
