import { useRef } from 'react';
import { cardTier, initials, POSTE_LABEL, resolveImg } from '../utils.js';

export default function PlayerCard({ joueur, mini = false, onClick }) {
  const tier = cardTier(joueur.buts, joueur.passesDecisives);
  const photo = resolveImg(joueur.photoUrl);
  const cls = `fifa-card ${tier}${mini ? ' mini' : ''}`;

  const ref = useRef(null);
  const glareRef = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rotateX = ((y - r.height / 2) / (r.height / 2)) * -10;
    const rotateY = ((x - r.width / 2) / (r.width / 2)) * 10;
    el.style.transform =
      `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.06,1.06,1.06)`;
    el.style.transition = 'transform 0.08s ease-out';
    if (glareRef.current) {
      glareRef.current.style.background =
        `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%)`;
      glareRef.current.style.opacity = '1';
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.transition = 'transform 0.5s ease';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  const tilt = mini ? {} : { onMouseMove: onMove, onMouseLeave: onLeave };

  return (
    <div className={cls} ref={ref} onClick={onClick} {...tilt}>
      <div className="fifa-top">
        <div>
          <div className="fifa-pos">{POSTE_LABEL[joueur.poste] || '—'}</div>
        </div>
        <div className="fifa-flag">{joueur.nationalite || ''}</div>
      </div>

      <div className="fifa-photo">
        {photo
          ? <img src={photo} alt={joueur.nom} />
          : <div className="fifa-initials">{initials(joueur.prenom, joueur.nom)}</div>}
      </div>

      <div className="fifa-name">{joueur.nom}</div>

      {!mini && (
        <div className="fifa-stats">
          <div className="fifa-stat"><span className="label">BUT</span><span className="value">{joueur.buts ?? 0}</span></div>
          <div className="fifa-stat"><span className="label">PAS</span><span className="value">{joueur.passesDecisives ?? 0}</span></div>
          <div className="fifa-stat"><span className="label">JAU</span><span className="value">{joueur.cartonsJaunes ?? 0}</span></div>
          <div className="fifa-stat"><span className="label">ROU</span><span className="value">{joueur.cartonsRouges ?? 0}</span></div>
          <div className="fifa-stat"><span className="label">N°</span><span className="value">{joueur.numero ?? '—'}</span></div>
          <div className="fifa-stat"><span className="label">MJ</span><span className="value">{joueur.matchsJoues ?? 0}</span></div>
        </div>
      )}

      {!mini && <div className="fifa-glare" ref={glareRef} />}
    </div>
  );
}
