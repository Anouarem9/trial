import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: <CheckCircle2 size={17} />,
  error: <AlertTriangle size={17} />,
  info: <Info size={17} />
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback(id => {
    setToasts(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 250);
  }, []);

  const push = useCallback((type, message) => {
    const id = ++idRef.current;
    setToasts(list => [...list.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3800);
  }, [dismiss]);

  const value = useMemo(() => ({
    success: m => push('success', m),
    error: m => push('error', m),
    info: m => push('info', m)
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? 'leaving' : ''}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fermer">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
