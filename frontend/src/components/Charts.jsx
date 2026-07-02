/**
 * Charts — dependency-free SVG stat visualizations.
 * Theme-aware via CSS variables (orange signal on dark surfaces).
 */
import { useEffect, useState } from 'react';

/* Animate a value from 0 → target once on mount, for entrance reveals. */
function useReveal(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/** Frame card for any visualization. */
export function VizCard({ title, highlight, tag, children }) {
  return (
    <div className="viz-card">
      <div className="viz-head">
        <div className="viz-title">{title} {highlight && <b>{highlight}</b>}</div>
        {tag && <span className="viz-tag">{tag}</span>}
      </div>
      {children}
    </div>
  );
}

/** Radial progress ring (0–max). */
export function StatRing({ value = 0, max = 99, size = 92, stroke = 9, caption = '', decimals = 0 }) {
  const v = useReveal(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, v / max));
  const display = decimals ? v.toFixed(decimals) : Math.round(v);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-fg"
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="ring-center">
        <span className="num">{display}</span>
        {caption && <span className="cap">{caption}</span>}
      </div>
    </div>
  );
}

/** Horizontal bar list. data: [{ label, value }], scaled to max (auto if omitted). */
export function BarChart({ data = [], max }) {
  const peak = max ?? Math.max(1, ...data.map(d => d.value || 0));
  return (
    <div className="bars">
      {data.map((d, i) => (
        <Bar key={i} label={d.label} value={d.value || 0} pct={(d.value || 0) / peak} delay={i * 80} />
      ))}
    </div>
  );
}
function Bar({ label, value, pct, delay }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct * 100), delay + 60); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div className="bar-row">
      <span className="bar-label" title={label}>{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${w}%` }} /></div>
      <span className="bar-val">{value}</span>
    </div>
  );
}

/** Radar / spider chart. axes: [{ label, value (0–max) }]. */
export function RadarChart({ axes = [], max = 100, size = 220 }) {
  const t = useReveal(1, 800);
  const cx = size / 2, cy = size / 2;
  const radius = size / 2 - 30;
  const n = axes.length;
  if (n < 3) return null;

  const pointAt = (i, rad) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const poly = axes
    .map((ax, i) => pointAt(i, radius * Math.min(1, (ax.value / max)) * t).join(','))
    .join(' ');

  return (
    <svg className="radar" width="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {rings.map((rg, ri) => (
        <polygon key={ri} className="radar-grid"
          points={axes.map((_, i) => pointAt(i, radius * rg).join(',')).join(' ')} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pointAt(i, radius);
        return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className="radar-poly" points={poly} />
      {axes.map((ax, i) => {
        const [x, y] = pointAt(i, radius * Math.min(1, ax.value / max) * t);
        const [lx, ly] = pointAt(i, radius + 16);
        return (
          <g key={i}>
            <circle className="radar-dot" cx={x} cy={y} r={3} />
            <text className="radar-label" x={lx} y={ly - 4} textAnchor="middle">{ax.label}</text>
            <text className="radar-label val" x={lx} y={ly + 7} textAnchor="middle">{Math.round(ax.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Donut distribution. data: [{ label, value, color }]. */
export function DonutChart({ data = [], size = 130, stroke = 18 }) {
  const t = useReveal(1, 900);
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {data.map((d, i) => {
            const frac = (d.value || 0) / total;
            const len = c * frac * t;
            const seg = (
              <circle key={i}
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            );
            offset += c * frac * t;
            return seg;
          })}
        </svg>
      </div>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div className="li" key={i}>
            <span className="sw" style={{ background: d.color }} />
            <span className="nm">{d.label}</span>
            <span className="vl">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sparkline trend. values: number[]. */
export function Sparkline({ values = [], height = 40 }) {
  if (values.length < 2) return <svg className="spark" height={height} />;
  const w = 100, h = height;
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" height={height}>
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.35)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </linearGradient>
      </defs>
      <path className="area" d={area} />
      <path d={line} />
    </svg>
  );
}
