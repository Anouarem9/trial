/**
 * Leaderboard — native JSX adaptation of the shadcn LeaderboardCard.
 * Keeps the same prop API (podiumRankings, rankings, currentUserId,
 * runOptions, onRunChange) but is styled with the app's dark/orange
 * design system and animated with GSAP. No Tailwind / TS required.
 */
import { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, ChevronLeft, ChevronRight } from 'lucide-react';
import { initials, resolveImg } from '../utils.js';
import { CountUp, Reveal } from '../anim.jsx';

const nf = new Intl.NumberFormat('fr-FR');

function formatRangeDate(date) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ name, photoUrl, size = 44 }) {
  const photo = resolveImg(photoUrl);
  return (
    <div className="lb-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {photo ? <img src={photo} alt={name} /> : <span>{initials(...String(name).split(' '))}</span>}
    </div>
  );
}

/* ---------- Podium (top 3) ---------- */
export function LeaderboardPodium({ rankings = [], className = '' }) {
  // Visual order: 2nd, 1st, 3rd
  const byRank = (r) => rankings.find((x) => x.rank === r);
  const order = [byRank(2), byRank(1), byRank(3)].filter(Boolean);

  return (
    <div className={`lb-podium ${className}`}>
      {order.map((r) => (
        <div key={r.userId} className={`lb-podium-col rank-${r.rank}`}>
          <div className="lb-podium-badge">
            {r.rank === 1 ? <Crown size={18} /> : <Medal size={16} />}
          </div>
          <Avatar name={r.userName} photoUrl={r.photoUrl} size={r.rank === 1 ? 72 : 56} />
          <div className="lb-podium-name" title={r.userName}>{r.userName}</div>
          <div className="lb-podium-value"><CountUp value={r.value} /></div>
          <div className="lb-podium-stand">
            <span className="lb-podium-pos">{r.rank}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Ranking list ---------- */
export function LeaderboardRankings({
  rankings = [],
  currentUserId,
  showPagination = false,
  defaultPageSize = 10,
}) {
  const visible = useMemo(() => rankings.filter((r) => r.displayed !== false), [rankings]);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(visible.length / defaultPageSize));

  useEffect(() => { setPage(0); }, [visible.length, defaultPageSize]);
  const safePage = Math.min(page, pageCount - 1);
  const slice = showPagination
    ? visible.slice(safePage * defaultPageSize, safePage * defaultPageSize + defaultPageSize)
    : visible;

  return (
    <div className="lb-list">
      {slice.map((r) => (
        <div key={r.userId} className={`lb-row ${r.userId === currentUserId ? 'me' : ''}`}>
          <div className={`lb-rank top-${r.rank <= 3 ? r.rank : 0}`}>{r.rank}</div>
          <Avatar name={r.userName} photoUrl={r.photoUrl} />
          <div className="lb-row-meta">
            <div className="lb-row-name">{r.userName}{r.userId === currentUserId && <span className="lb-you">VOUS</span>}</div>
            {r.byline && <div className="lb-row-byline">{r.byline}</div>}
          </div>
          <div className="lb-row-value">{nf.format(r.value)}</div>
        </div>
      ))}

      {showPagination && pageCount > 1 && (
        <div className="lb-pagination">
          <button className="lb-page-btn" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="lb-page-info">{safePage + 1} / {pageCount}</span>
          <button className="lb-page-btn" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Card wrapper ---------- */
export function LeaderboardCard({
  className = '',
  title = 'Leaderboard',
  fromDate,
  toDate,
  podiumRankings = [],
  rankings = [],
  currentUserId,
  runOptions,
  selectedRunId,
  onRunChange,
  ...props
}) {
  const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? '';
  const hasOnRunChange = Boolean(onRunChange);
  const [localRunId, setLocalRunId] = useState(resolvedRunId);

  useEffect(() => { if (!hasOnRunChange) setLocalRunId(resolvedRunId); }, [hasOnRunChange, resolvedRunId]);
  const activeRunId = hasOnRunChange ? resolvedRunId : localRunId;

  return (
    <div className={`lb-card ${className}`} {...props}>
      <div className="lb-head">
        <div>
          <div className="eyebrow">Classement</div>
          <h3 className="lb-title">{title}</h3>
          <p className="lb-range">{formatRangeDate(fromDate)} — {formatRangeDate(toDate)}</p>
        </div>

        {runOptions && runOptions.length > 0 && (
          <select
            aria-label="Critère du classement"
            value={activeRunId}
            onChange={(e) => (onRunChange ? onRunChange(e.target.value) : setLocalRunId(e.target.value))}
            className="lb-select"
          >
            {runOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
      </div>

      <Reveal key={activeRunId}>
        <LeaderboardPodium rankings={podiumRankings} className="lb-mb" />
        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
        />
      </Reveal>
    </div>
  );
}
