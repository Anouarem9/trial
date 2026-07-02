import { useState } from 'react';
import { initials, resolveImg } from '../utils.js';

/**
 * Square 1:1 logo for a team.
 * - If a logo image is available, render it at 1:1 with object-fit: contain and no background.
 * - Otherwise render the team's initials inside a neutral square.
 */
export default function TeamLogo({ equipe, size = 24 }) {
  const src = resolveImg(equipe?.logoUrl);
  const [failed, setFailed] = useState(false);
  const square = { width: size, height: size, minWidth: size, minHeight: size };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={equipe?.nom || ''}
        onError={() => setFailed(true)}
        style={{ ...square, objectFit: 'contain', borderRadius: Math.max(2, size / 8), background: 'transparent' }}
      />
    );
  }

  return (
    <div
      style={{
        ...square,
        borderRadius: Math.max(2, size / 8),
        background: 'var(--bg)',
        color: 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.max(9, size * 0.42),
        flexShrink: 0
      }}
    >
      {initials(equipe?.nom) || '?'}
    </div>
  );
}
