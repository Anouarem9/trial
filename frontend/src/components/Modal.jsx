import { useRef } from 'react';
import { X } from 'lucide-react';
import { gsap, useGSAP } from '../anim.jsx';

export default function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.from(ref.current, { y: 18, scale: 0.96, opacity: 0, duration: 0.4, ease: 'power3.out' });
  }, { scope: ref });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
