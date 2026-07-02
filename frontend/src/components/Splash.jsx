import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../anim.jsx';

const C = 50;   // ball center in viewBox units
const R = 46;   // ball radius

/**
 * Fake orthographic sphere projection: a point's flat radial distance from
 * the center is remapped to R·sin(d/R · π/2), so panels near the rim get
 * foreshortened the way they would on a real sphere.
 */
function proj([x, y]) {
  const dx = x - C, dy = y - C;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return [x, y];
  const k = (R * Math.sin((Math.min(d, R) / R) * (Math.PI / 2))) / d;
  return [C + dx * k, C + dy * k];
}

/** Regular pentagon vertices centered at (cx,cy). */
function pentPoints(cx, cy, r, rotDeg = 0) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI / 180) * (rotDeg - 90 + i * 72);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

const toStr = pts => pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

function Football() {
  const verts = [];
  const rim = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI / 180) * (-90 + i * 72);
    verts.push([C + 14 * Math.cos(a), C + 14 * Math.sin(a)]);
    rim.push({ x: C + 34 * Math.cos(a), y: C + 34 * Math.sin(a), rot: -90 + i * 72 + 36 });
  }
  const inner = pentPoints(C, C, 14).map(proj);
  const rims = rim.map(r => pentPoints(r.x, r.y, 11.5, r.rot).map(proj));
  const seams = rim.map((r, i) => ({ a: proj(verts[i]), b: proj([r.x, r.y]) }));

  return (
    <svg className="splash-ball" viewBox="0 0 100 100" width="130" height="130" aria-hidden>
      <defs>
        {/* Sphere base shading — light source top-left */}
        <radialGradient id="ballBase" cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#eef2f7" />
          <stop offset="72%" stopColor="#c2cbd9" />
          <stop offset="100%" stopColor="#6f7c8e" />
        </radialGradient>
        {/* Edge vignette to round off the sphere */}
        <radialGradient id="ballShade" cx="36%" cy="30%" r="85%">
          <stop offset="55%" stopColor="rgba(8, 14, 28, 0)" />
          <stop offset="85%" stopColor="rgba(8, 14, 28, 0.22)" />
          <stop offset="100%" stopColor="rgba(8, 14, 28, 0.55)" />
        </radialGradient>
        {/* Specular highlight */}
        <radialGradient id="ballSpec" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="ballClip"><circle cx={C} cy={C} r={R} /></clipPath>
      </defs>

      <circle cx={C} cy={C} r={R} fill="url(#ballBase)" />

      <g clipPath="url(#ballClip)">
        {/* Seams between panels */}
        {seams.map((s, i) => (
          <line key={`s${i}`} x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]}
                stroke="#7e8a9a" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {/* Dark panels (center + rim, rim ones foreshortened by projection) */}
        <polygon points={toStr(inner)} fill="#141b27" stroke="#141b27" strokeWidth="1.5" strokeLinejoin="round" />
        {rims.map((p, i) => (
          <polygon key={`r${i}`} points={toStr(p)} fill="#141b27" stroke="#141b27"
                   strokeWidth="1.5" strokeLinejoin="round" />
        ))}
        {/* Sphere vignette over the panels */}
        <circle cx={C} cy={C} r={R} fill="url(#ballShade)" />
      </g>

      {/* Specular highlight + rim line */}
      <ellipse cx="36" cy="27" rx="14" ry="9" fill="url(#ballSpec)"
               transform="rotate(-28 36 27)" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(15, 23, 42, 0.55)" strokeWidth="1.2" />
    </svg>
  );
}

export default function Splash() {
  const ref = useRef(null);
  const [done, setDone] = useState(false);

  useGSAP(() => {
    gsap.set('.splash-ball', { transformOrigin: '50% 50%' });
    gsap.set('.splash-shadow', { transformOrigin: '50% 50%' });
    // Continuous roll-spin for the whole sequence.
    gsap.to('.splash-ball', { rotation: 720, duration: 2.6, ease: 'power1.inOut' });

    const tl = gsap.timeline({ onComplete: () => setDone(true) });
    tl.from('.splash-ball-wrap', { x: -190, opacity: 0, duration: 0.85, ease: 'power3.out' })
      .from('.splash-ball', { scale: 0.55, duration: 0.85, ease: 'power3.out' }, '<')
      .to('.splash-ball', { y: -16, duration: 0.22, ease: 'power2.out' }, '-=0.12')
      .to('.splash-shadow', { scaleX: 0.55, opacity: 0.45, duration: 0.22, ease: 'power2.out' }, '<')
      .to('.splash-ball', { y: 0, duration: 0.5, ease: 'bounce.out' })
      .to('.splash-shadow', { scaleX: 1, opacity: 1, duration: 0.5, ease: 'bounce.out' }, '<')
      .from('.splash-word', { y: 18, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.45')
      .from('.splash-sub', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3')
      .fromTo('.splash-bar > i', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power1.inOut' }, '-=0.15')
      .to('.splash', { opacity: 0, duration: 0.55, ease: 'power2.inOut', delay: 0.2 });
  }, { scope: ref });

  if (done) return null;

  return (
    <div ref={ref}>
      <div className="splash">
        <div className="splash-glow" />
        <div className="splash-ball-wrap">
          <Football />
          <div className="splash-shadow" />
        </div>
        <div className="splash-word">Score<b>Cup</b></div>
        <div className="splash-sub">Tournament Intelligence</div>
        <div className="splash-bar"><i /></div>
      </div>
    </div>
  );
}
